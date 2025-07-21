
import React from 'react'

interface PDFReportWrapperProps {
  children: React.ReactNode
  isForPDF?: boolean
}

/**
 * Enhanced PDF rendering wrapper that creates a clean, print-optimized layout
 */
export function PDFReportWrapper({ children, isForPDF = false }: PDFReportWrapperProps) {
  if (!isForPDF) {
    // Normal app rendering - preserve existing design
    return <>{children}</>
  }

  // PDF-only rendering with optimized structure
  return (
    <div 
      className="pdf-container"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '20mm',
        backgroundColor: 'white',
        position: 'relative',
        boxSizing: 'border-box',
        overflow: 'visible',
        fontFamily: 'Arial, sans-serif',
        fontSize: '14px',
        lineHeight: '1.4',
        color: '#333333'
      }}
    >
      <div style={{ 
        width: '100%', 
        margin: '0', 
        padding: '0',
        boxSizing: 'border-box'
      }}>
        <PDFContentFilter>
          {children}
        </PDFContentFilter>
      </div>
    </div>
  )
}

/**
 * PDF Content Filter - Removes problematic interactive components for PDF rendering
 */
function PDFContentFilter({ children }: { children: React.ReactNode }) {
  const processChildren = (node: React.ReactNode): React.ReactNode => {
    if (!node) return null
    
    if (React.isValidElement(node)) {
      // Only filter out the most problematic interactive components
      const problematicComponents = [
        'TooltipContent',
        'PopoverContent', 
        'DialogContent'
      ]
      
      let componentName = ''
      if (typeof node.type === 'string') {
        componentName = node.type
      } else if (node.type && typeof node.type === 'function') {
        const typeAny = node.type as any
        componentName = typeAny.displayName || typeAny.name || ''
      }
      
      // Remove only content overlays, not triggers
      if (problematicComponents.includes(componentName)) {
        return null
      }
      
      // For TooltipTrigger, render the trigger content without tooltip functionality
      if (componentName === 'TooltipTrigger' && node.props.children) {
        return processChildren(node.props.children)
      }
      
      // Process children recursively for valid components
      if (node.props.children) {
        const processedChildren = React.Children.map(node.props.children, processChildren)
        return React.cloneElement(node, node.props, processedChildren)
      }
      
      return node
    }
    
    if (Array.isArray(node)) {
      return node.map(processChildren).filter(Boolean)
    }
    
    return node
  }
  
  return <>{processChildren(children)}</>
}

export default PDFReportWrapper
