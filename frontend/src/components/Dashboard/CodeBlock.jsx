import React, { useState } from 'react';

const LANGUAGE_LABELS = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    jsx: 'React JSX',
    tsx: 'React TSX',
    python: 'Python',
    html: 'HTML',
    css: 'CSS',
    sql: 'SQL',
    json: 'JSON',
    cpp: 'C++',
    c: 'C',
    java: 'Java',
    go: 'Go',
    rust: 'Rust',
    bash: 'Bash / Shell',
    markdown: 'Markdown',
    plaintext: 'Plain Text'
};

const CodeBlock = ({ code, language = 'javascript', filename = 'snippet' }) => {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true);

    const lines = (code || '').split('\n');
    const lineCount = lines.length;
    const isLong = lineCount > 15;

    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Lightweight syntax highlighter helper using HTML tokens
    const formatSyntax = (rawCode, lang) => {
        if (!rawCode) return '';

        let html = rawCode
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');

        // Highlight comments
        html = html.replace(/(\/\/.*$|\/\*[\s\S]*?\*\/|#.*$)/gm, '<span class="token-comment">$1</span>');

        // Highlight strings
        html = html.replace(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, '<span class="token-string">$1</span>');

        // Highlight keywords
        const keywords = /\b(const|let|var|function|return|if|else|for|while|switch|case|break|import|export|from|default|class|extends|async|await|try|catch|new|this|typeof|void|delete|in|of|instanceof|def|self|None|True|False|SELECT|FROM|WHERE|INSERT|UPDATE|DELETE|JOIN|GROUP|BY|ORDER|HAVING|CREATE|TABLE|DROP|ALTER)\b/g;
        html = html.replace(keywords, '<span class="token-keyword">$1</span>');

        // Highlight numbers
        html = html.replace(/\b(\d+)\b/g, '<span class="token-number">$1</span>');

        return html;
    };

    const displayedLines = isLong && !isExpanded ? lines.slice(0, 15) : lines;

    return (
        <div className="code-block-container">
            {/* Header Bar */}
            <div className="code-block-header">
                <div className="code-info">
                    <span className="code-icon">💻</span>
                    <span className="code-filename">{filename}</span>
                    <span className="code-lang-badge">
                        {LANGUAGE_LABELS[language.toLowerCase()] || language.toUpperCase()}
                    </span>
                </div>
                <div className="code-actions">
                    <button
                        type="button"
                        className={`copy-code-btn ${copied ? 'copied' : ''}`}
                        onClick={handleCopy}
                        title="Copy code to clipboard"
                    >
                        {copied ? '✓ Copied' : '📋 Copy'}
                    </button>
                </div>
            </div>

            {/* Code View with Line Numbers */}
            <div className={`code-block-body ${isLong && !isExpanded ? 'collapsed' : ''}`}>
                <div className="line-numbers">
                    {displayedLines.map((_, i) => (
                        <span key={i}>{i + 1}</span>
                    ))}
                </div>
                <pre className="code-content">
                    <code>
                        {displayedLines.map((line, idx) => (
                            <div
                                key={idx}
                                className="code-line"
                                dangerouslySetInnerHTML={{ __html: formatSyntax(line, language) || '&nbsp;' }}
                            />
                        ))}
                    </code>
                </pre>
            </div>

            {/* Expand / Collapse toggle for long snippets */}
            {isLong && (
                <div className="code-block-footer">
                    <button
                        type="button"
                        className="toggle-expand-btn"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? '▲ Collapse Code' : `▼ Expand ${lineCount - 15} more lines`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CodeBlock;
