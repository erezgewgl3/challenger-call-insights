// Circuit breaker implementation for production resilience

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open', 
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  minimumRequestCount: number;
  successThreshold: number;
}

export interface CircuitBreakerMetrics {
  totalRequests: number;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  lastSuccessTime?: number;
  state: CircuitState;
  stateChangeTime: number;
}

export interface CircuitBreakerResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  circuitState: CircuitState;
  metrics: CircuitBreakerMetrics;
}

export class CircuitBreaker<T> {
  private config: CircuitBreakerConfig;
  private metrics: CircuitBreakerMetrics;
  private requestLog: Array<{ timestamp: number; success: boolean }> = [];
  
  constructor(
    private operation: () => Promise<T>,
    private name: string,
    config: Partial<CircuitBreakerConfig> = {}
  ) {
    this.config = {
      failureThreshold: 5, // Open circuit after 5 failures
      recoveryTimeout: 60000, // Try recovery after 1 minute
      monitoringPeriod: 300000, // Monitor over 5 minutes
      minimumRequestCount: 3, // Need at least 3 requests to evaluate
      successThreshold: 3, // Need 3 successful requests to close circuit
      ...config
    };

    this.metrics = {
      totalRequests: 0,
      failureCount: 0,
      successCount: 0,
      state: CircuitState.CLOSED,
      stateChangeTime: Date.now()
    };

    console.log(`Circuit breaker "${name}" initialized with config:`, this.config);
  }

  async execute(): Promise<CircuitBreakerResult<T>> {
    this.cleanupOldRequests();
    
    // Check if circuit should transition states
    this.updateCircuitState();

    const currentState = this.metrics.state;

    // If circuit is open, fail fast
    if (currentState === CircuitState.OPEN) {
      const timeSinceOpened = Date.now() - this.metrics.stateChangeTime;
      
      if (timeSinceOpened < this.config.recoveryTimeout) {
        return {
          success: false,
          error: new Error(`Circuit breaker is OPEN. Retry in ${Math.ceil((this.config.recoveryTimeout - timeSinceOpened) / 1000)} seconds.`),
          circuitState: currentState,
          metrics: { ...this.metrics }
        };
      } else {
        // Move to half-open state
        this.transitionToHalfOpen();
      }
    }

    // Execute the operation
    return await this.executeOperation();
  }

  private async executeOperation(): Promise<CircuitBreakerResult<T>> {
    const startTime = Date.now();
    
    try {
      console.log(`Circuit breaker "${this.name}": Executing operation (state: ${this.metrics.state})`);
      
      const result = await this.operation();
      
      // Record success
      this.recordRequest(true);
      this.updateMetrics(true);
      
      // If we're in half-open state and got enough successes, close the circuit
      if (this.metrics.state === CircuitState.HALF_OPEN) {
        const recentSuccesses = this.getRecentSuccessCount();
        if (recentSuccesses >= this.config.successThreshold) {
          this.transitionToClosed();
        }
      }

      console.log(`Circuit breaker "${this.name}": Operation succeeded in ${Date.now() - startTime}ms`);

      return {
        success: true,
        data: result,
        circuitState: this.metrics.state,
        metrics: { ...this.metrics }
      };

    } catch (error) {
      // Record failure
      this.recordRequest(false);
      this.updateMetrics(false);
      
      console.error(`Circuit breaker "${this.name}": Operation failed in ${Date.now() - startTime}ms:`, error.message);

      // Check if we should open the circuit
      if (this.shouldOpenCircuit()) {
        this.transitionToOpen();
      }

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        circuitState: this.metrics.state,
        metrics: { ...this.metrics }
      };
    }
  }

  private recordRequest(success: boolean): void {
    const now = Date.now();
    this.requestLog.push({ timestamp: now, success });
    
    // Keep only requests within monitoring period
    this.requestLog = this.requestLog.filter(
      req => now - req.timestamp <= this.config.monitoringPeriod
    );
  }

  private updateMetrics(success: boolean): void {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successCount++;
      this.metrics.lastSuccessTime = Date.now();
    } else {
      this.metrics.failureCount++;
      this.metrics.lastFailureTime = Date.now();
    }
  }

  private cleanupOldRequests(): void {
    const cutoff = Date.now() - this.config.monitoringPeriod;
    this.requestLog = this.requestLog.filter(req => req.timestamp > cutoff);
  }

  private shouldOpenCircuit(): boolean {
    const recentRequests = this.requestLog.length;
    
    // Need minimum number of requests to evaluate
    if (recentRequests < this.config.minimumRequestCount) {
      return false;
    }

    const recentFailures = this.requestLog.filter(req => !req.success).length;
    const failureRate = recentFailures / recentRequests;
    
    console.log(`Circuit breaker "${this.name}": Failure rate ${(failureRate * 100).toFixed(1)}% (${recentFailures}/${recentRequests})`);
    
    return recentFailures >= this.config.failureThreshold && failureRate > 0.5;
  }

  private getRecentSuccessCount(): number {
    return this.requestLog.filter(req => req.success).length;
  }

  private updateCircuitState(): void {
    const now = Date.now();
    
    switch (this.metrics.state) {
      case CircuitState.OPEN:
        if (now - this.metrics.stateChangeTime >= this.config.recoveryTimeout) {
          this.transitionToHalfOpen();
        }
        break;
        
      case CircuitState.HALF_OPEN:
        // Will be handled in executeOperation
        break;
        
      case CircuitState.CLOSED:
        // Will transition to open if failure threshold is met
        break;
    }
  }

  private transitionToOpen(): void {
    if (this.metrics.state !== CircuitState.OPEN) {
      console.warn(`Circuit breaker "${this.name}": Transitioning to OPEN state`);
      this.metrics.state = CircuitState.OPEN;
      this.metrics.stateChangeTime = Date.now();
      
      // Notify external systems about circuit opening
      this.notifyStateChange('OPENED');
    }
  }

  private transitionToHalfOpen(): void {
    if (this.metrics.state !== CircuitState.HALF_OPEN) {
      console.info(`Circuit breaker "${this.name}": Transitioning to HALF_OPEN state`);
      this.metrics.state = CircuitState.HALF_OPEN;
      this.metrics.stateChangeTime = Date.now();
      
      this.notifyStateChange('HALF_OPENED');
    }
  }

  private transitionToClosed(): void {
    if (this.metrics.state !== CircuitState.CLOSED) {
      console.info(`Circuit breaker "${this.name}": Transitioning to CLOSED state`);
      this.metrics.state = CircuitState.CLOSED;
      this.metrics.stateChangeTime = Date.now();
      
      // Reset failure metrics
      this.metrics.failureCount = 0;
      this.requestLog = this.requestLog.filter(req => req.success);
      
      this.notifyStateChange('CLOSED');
    }
  }

  private notifyStateChange(transition: string): void {
    // In production, this could send notifications to monitoring systems
    console.log(`Circuit breaker "${this.name}" ${transition} at ${new Date().toISOString()}`);
    
    // Could also emit events for external monitoring
    // this.eventEmitter?.emit('circuit-breaker-state-change', {
    //   name: this.name,
    //   transition,
    //   metrics: this.metrics
    // });
  }

  // Public methods for monitoring
  getMetrics(): CircuitBreakerMetrics {
    this.cleanupOldRequests();
    
    const recentRequests = this.requestLog.length;
    const recentFailures = this.requestLog.filter(req => !req.success).length;
    const recentSuccesses = this.requestLog.filter(req => req.success).length;
    
    return {
      ...this.metrics,
      totalRequests: recentRequests,
      failureCount: recentFailures,
      successCount: recentSuccesses
    };
  }

  getState(): CircuitState {
    return this.metrics.state;
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  // Force circuit state changes (for testing/maintenance)
  forceOpen(): void {
    console.warn(`Circuit breaker "${this.name}": Force opening circuit`);
    this.transitionToOpen();
  }

  forceClose(): void {
    console.info(`Circuit breaker "${this.name}": Force closing circuit`);
    this.transitionToClosed();
  }

  reset(): void {
    console.info(`Circuit breaker "${this.name}": Resetting circuit breaker`);
    this.metrics = {
      totalRequests: 0,
      failureCount: 0,
      successCount: 0,
      state: CircuitState.CLOSED,
      stateChangeTime: Date.now()
    };
    this.requestLog = [];
  }
}

// Circuit breaker manager for multiple services
export class CircuitBreakerManager {
  private breakers = new Map<string, CircuitBreaker<any>>();

  createCircuitBreaker<T>(
    name: string,
    operation: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreaker<T> {
    if (this.breakers.has(name)) {
      throw new Error(`Circuit breaker "${name}" already exists`);
    }

    const breaker = new CircuitBreaker(operation, name, config);
    this.breakers.set(name, breaker);
    
    console.log(`Circuit breaker manager: Created circuit breaker "${name}"`);
    return breaker;
  }

  getCircuitBreaker(name: string): CircuitBreaker<any> | undefined {
    return this.breakers.get(name);
  }

  getAllMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    
    for (const [name, breaker] of this.breakers) {
      metrics[name] = breaker.getMetrics();
    }
    
    return metrics;
  }

  getHealthSummary(): {
    total: number;
    healthy: number;
    degraded: number;
    unhealthy: number;
  } {
    const summary = {
      total: this.breakers.size,
      healthy: 0,
      degraded: 0,
      unhealthy: 0
    };

    for (const breaker of this.breakers.values()) {
      switch (breaker.getState()) {
        case CircuitState.CLOSED:
          summary.healthy++;
          break;
        case CircuitState.HALF_OPEN:
          summary.degraded++;
          break;
        case CircuitState.OPEN:
          summary.unhealthy++;
          break;
      }
    }

    return summary;
  }

  // Cleanup method for graceful shutdown
  cleanup(): void {
    console.log('Circuit breaker manager: Cleaning up all circuit breakers');
    this.breakers.clear();
  }
}
