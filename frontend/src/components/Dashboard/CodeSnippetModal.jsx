import React, { useState } from 'react';

const LANGUAGES = [
    { value: 'javascript', label: 'JavaScript (.js)' },
    { value: 'typescript', label: 'TypeScript (.ts)' },
    { value: 'jsx', label: 'React JSX (.jsx)' },
    { value: 'tsx', label: 'React TSX (.tsx)' },
    { value: 'python', label: 'Python (.py)' },
    { value: 'html', label: 'HTML (.html)' },
    { value: 'css', label: 'CSS (.css)' },
    { value: 'sql', label: 'SQL (.sql)' },
    { value: 'json', label: 'JSON (.json)' },
    { value: 'cpp', label: 'C++ (.cpp)' },
    { value: 'java', label: 'Java (.java)' },
    { value: 'go', label: 'Go (.go)' },
    { value: 'rust', label: 'Rust (.rs)' },
    { value: 'bash', label: 'Bash / Shell (.sh)' },
    { value: 'markdown', label: 'Markdown (.md)' },
    { value: 'plaintext', label: 'Plain Text' }
];

const CodeSnippetModal = ({ isOpen, onClose, onSendSnippet, channelName }) => {
    const [filename, setFilename] = useState('');
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState('');

    if (!isOpen) return null;

    const handleKeyDown = (e) => {
        // Handle Tab key inside code textarea
        if (e.key === 'Tab') {
            e.preventDefault();
            const start = e.target.selectionStart;
            const end = e.target.selectionEnd;

            // Insert 2 spaces
            const updatedCode = code.substring(0, start) + '  ' + code.substring(end);
            setCode(updatedCode);

            // Move cursor forward by 2 spaces
            setTimeout(() => {
                e.target.selectionStart = e.target.selectionEnd = start + 2;
            }, 0);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!code.trim()) return;

        const defaultFilename = filename.trim() || `snippet.${language === 'jsx' ? 'jsx' : language === 'tsx' ? 'tsx' : language === 'python' ? 'py' : language === 'typescript' ? 'ts' : language}`;

        onSendSnippet({
            code: code.trim(),
            language: language,
            filename: defaultFilename
        });

        // Reset and close
        setCode('');
        setFilename('');
        setLanguage('javascript');
        onClose();
    };

    const lineCount = code ? code.split('\n').length : 1;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content code-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="code-modal-header">
                    <h3>💻 Share Code Snippet</h3>
                    <p>Post formatted code directly to #{channelName}</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="code-modal-row">
                        <div className="form-group flex-2">
                            <label>FILE NAME / TITLE</label>
                            <input
                                type="text"
                                placeholder="e.g. authMiddleware.js or main.py"
                                value={filename}
                                onChange={(e) => setFilename(e.target.value)}
                            />
                        </div>

                        <div className="form-group flex-1">
                            <label>LANGUAGE</label>
                            <select
                                className="code-lang-select"
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.value} value={lang.value}>
                                        {lang.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="code-label-row">
                            <label>CODE SNIPPET</label>
                            <span className="line-count-tag">{lineCount} {lineCount === 1 ? 'line' : 'lines'}</span>
                        </div>
                        <textarea
                            className="code-input-textarea"
                            rows={10}
                            placeholder="// Paste or write code here... (Tab key supported)"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="cancel-btn" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="action-btn share-code-btn"
                            disabled={!code.trim()}
                        >
                            🚀 Share Code Snippet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CodeSnippetModal;
