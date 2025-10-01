
import React from 'react';

interface MarkdownRendererProps {
  text: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text }) => {
  const lines = text.split('\n');

  const renderLine = (line: string) => {
    // Bold: **text**
    line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    return <span dangerouslySetInnerHTML={{ __html: line }} />;
  };

  const elements = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const isListItem = line.trim().startsWith('- ') || line.trim().startsWith('* ');

    if (isListItem) {
      if (!inList) {
        inList = true;
        elements.push(<ul key={`ul-${i}`} className="list-disc list-inside pr-4 space-y-1"></ul>);
      }
      const listContent = line.trim().substring(2);
      const lastElement = elements[elements.length - 1];
      if (lastElement && lastElement.type === 'ul') {
        const newLi = <li key={`li-${i}`}>{renderLine(listContent)}</li>;
        // This is a simplified way to add children to the last ul element.
        // A more robust implementation might involve building a tree structure.
        const updatedChildren = React.Children.toArray(lastElement.props.children);
        updatedChildren.push(newLi);
        elements[elements.length - 1] = React.cloneElement(lastElement, {}, updatedChildren);
      }
    } else {
      inList = false;
      elements.push(<p key={`p-${i}`}>{renderLine(line)}</p>);
    }
  }

  return <div className="space-y-2">{elements}</div>;
};

export default MarkdownRenderer;