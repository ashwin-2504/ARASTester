import React from 'react';

/**
 * Validates if a string is XML
 */
const isXml = (text: string): boolean => {
  return typeof text === 'string' && text.trim().startsWith('<') && text.trim().endsWith('>');
};

/**
 * Simple XML formatter
 */
const formatXml = (xml: string): string => {
  let formatted = '';
  const reg = /(>)(<)(\/*)/g;
  xml = xml.replace(reg, '$1\r\n$2$3');
  let pad = 0;

  xml.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) {
        pad -= 1;
      }
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    } else {
      indent = 0;
    }

    let padding = '';
    for (let i = 0; i < pad; i++) {
      padding += '  ';
    }

    formatted += padding + node + '\r\n';
    pad += indent;
  });

  return formatted;
};

interface JsonViewerProps {
  data: unknown;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  if (data === undefined || data === null) return null;

  const renderValue = (value: unknown): React.ReactNode => {
    if (value === null) return <span className="text-rose-400">null</span>;
    if (typeof value === 'boolean') return <span className="text-rose-400">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-blue-400">{value}</span>;
    if (typeof value === 'string') {
      if (isXml(value)) {
        return (
          <div className="mt-1 pl-4 border-l-2 border-slate-700">
            <pre className="text-amber-300 font-mono text-xs whitespace-pre-wrap">{formatXml(value)}</pre>
          </div>
        );
      }
      return <span className="text-emerald-400">"{value}"</span>;
    }
    return <span>{JSON.stringify(value)}</span>;
  };

  const renderNode = (key: string, value: unknown, isLast: boolean): React.ReactNode => {
    return (
      <div key={key} className="pl-4">
        <span className="text-sky-300">"{key}"</span>: {typeof value === 'object' && value !== null ? (
          renderObject(value as Record<string, unknown>)
        ) : (
          renderValue(value)
        )}
        {!isLast && <span className="text-slate-500">,</span>}
      </div>
    );
  };

  const renderObject = (obj: Record<string, unknown> | unknown): React.ReactNode => {
    if (obj === null) return <span className="text-rose-400">null</span>;
    if (typeof obj !== 'object') return renderValue(obj);

    const keys = Object.keys(obj as object);
    if (keys.length === 0) return <span>{'{ }'}</span>;

    return (
      <span>
        {'{'}
        {keys.map((key, index) => renderNode(key, (obj as any)[key], index === keys.length - 1))}
        {'}'}
      </span>
    );
  };

  return (
    <div className="font-mono text-xs text-slate-200 overflow-x-auto">
      {renderObject(data)}
    </div>
  );
};

export default JsonViewer;
