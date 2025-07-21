
import React from 'react'

interface PDFReportWrapperProps {
  children: React.ReactNode
  isForPDF?: boolean
}

/**
 * ENHANCED PDF-ONLY rendering wrapper that removes problematic interactive elements
 * This component creates a separate rendering path for PDF exports only
 */
export function PDFReportWrapper({ children, isForPDF = false }: PDFReportWrapperProps) {
  if (!isForPDF) {
    // Normal app rendering - NO CHANGES to existing beautiful design
    return <>{children}</>
  }

  // PDF-only rendering with simplified structure
  return (
    <div 
      className="pdf-only-container"
      style={{
        width: '210mm',
        minHeight: '297mm',
        maxWidth: '210mm',
        margin: '0 auto',
        padding: '20mm',
        backgroundColor: 'white',
        transform: 'translateX(0)',
        position: 'relative',
        left: '0',
        right: '0',
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
        {/* SIMPLIFIED: Render children without complex React patterns */}
        <PDFContentFilter>
          {children}
        </PDFContentFilter>
      </div>
    </div>
  )
}

/**
 * PDF Content Filter - Removes or simplifies problematic elements for PDF rendering
 */
function PDFContentFilter({ children }: { children: React.ReactNode }) {
  // Recursively process React children to remove problematic components
  const processChildren = (node: React.ReactNode): React.ReactNode => {
    if (!node) return null
    
    if (React.isValidElement(node)) {
      // Skip problematic components that use portals or complex DOM manipulation
      const problematicComponents = [
        'Tooltip',
        'TooltipTrigger', 
        'TooltipContent',
        'Popover',
        'PopoverTrigger',
        'PopoverContent',
        'Dialog',
        'DialogTrigger',
        'DropdownMenu',
        'HoverCard'
      ]
      
      const componentName = typeof node.type === 'string' ? node.type : node.type?.displayName || node.type?.name || ''
      
      if (problematicComponents.some(comp => componentName.includes(comp))) {
        // For tooltip triggers, render just the trigger content without the tooltip
        if (componentName.includes('Tooltip') && node.props.children) {
          return processChildren(node.props.children)
        }
        // For other problematic components, skip entirely
        return null
      }
      
      // Process children recursively
      const processedChildren = React.Children.map(node.props.children, processChildren)
      
      return React.cloneElement(node, node.props, processedChildren)
    }
    
    if (Array.isArray(node)) {
      return node.map(processChildren)
    }
    
    return node
  }
  
  return <>{processChildren(children)}</>
}

export default PDFReportWrapper
