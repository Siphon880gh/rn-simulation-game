// Docs functionality for displaying markdown files from docs/ directory
(function() {
    'use strict';

    // List of markdown files in docs/ directory
    const markdownFiles = [
        'MEDICATION_WINDOW_MECHANICS.md',
        'README_UTILS.md',
        'REFACTORING_SUMMARY.md'
    ];

    // Initialize docs functionality when DOM is ready
    $(document).ready(function() {
        initializeDocsDropdown();
        loadDocsList();
        setupEventListeners();
    });

    function initializeDocsDropdown() {
        const docsButton = $('#docs-button');
        const docsDropdown = $('#docs-dropdown');

        // Toggle dropdown on button click
        docsButton.on('click', function(e) {
            e.stopPropagation();
            docsDropdown.toggleClass('hidden');
        });

        // Close dropdown when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#docs-button, #docs-dropdown').length) {
                docsDropdown.addClass('hidden');
            }
        });
    }

    function loadDocsList() {
        const docsList = $('#docs-list');
        docsList.empty();

        markdownFiles.forEach(function(filename) {
            const displayName = formatDisplayName(filename);
            const listItem = $(`
                <div class="docs-item px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer flex text-left gap-2"
                     data-filename="${filename}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                         stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                         class="lucide lucide-file-text text-blue-500">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                    </svg>
                    ${displayName}
                </div>
            `);
            docsList.append(listItem);
        });
    }

    function setupEventListeners() {
        // Handle clicking on doc items
        $(document).on('click', '.docs-item', function(e) {
            e.preventDefault();
            const filename = $(this).data('filename');
            openMarkdownInNewWindow(filename);
            $('#docs-dropdown').addClass('hidden');
        });
    }

    function formatDisplayName(filename) {
        // Convert filename to a more readable format
        return filename
            .replace('.md', '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function openMarkdownInNewWindow(filename) {
        // Fetch the markdown file and render it in a new window
        fetch(`../docs/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(markdownContent => {
                const htmlContent = marked.parse(markdownContent);
                createDocumentWindow(filename, htmlContent);
            })
            .catch(error => {
                console.error('Error loading markdown file:', error);
                alert(`Error loading ${filename}. Please check if the file exists.`);
            });
    }

    function createDocumentWindow(filename, htmlContent) {
        const displayName = formatDisplayName(filename);
        
        // Create a new window
        const newWindow = window.open('', '_blank', 'width=900,height=700,scrollbars=yes,resizable=yes');
        
        if (!newWindow) {
            alert('Pop-up blocked! Please allow pop-ups for this site to view documentation.');
            return;
        }

        // Write the HTML content to the new window
        newWindow.document.write(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${displayName} - Documentation</title>
                
                <style>
                    /* Custom styles for markdown content */
                    .markdown-content {
                        line-height: 1.6;
                    }
                    .markdown-content h1 {
                        @apply text-3xl font-bold mb-4 text-gray-900 border-b border-gray-200 pb-2;
                    }
                    .markdown-content h2 {
                        @apply text-2xl font-semibold mb-3 text-gray-800 mt-6;
                    }
                    .markdown-content h3 {
                        @apply text-xl font-semibold mb-2 text-gray-700 mt-4;
                    }
                    .markdown-content p {
                        @apply mb-4 text-gray-600;
                    }
                    .markdown-content ul, .markdown-content ol {
                        @apply mb-4 pl-6;
                    }
                    .markdown-content li {
                        @apply mb-1 text-gray-600;
                    }
                    .markdown-content code {
                        @apply bg-gray-100 px-1 py-0.5 rounded text-sm font-mono text-red-600;
                    }
                    .markdown-content pre {
                        @apply bg-gray-100 p-4 rounded-lg overflow-x-auto mb-4;
                    }
                    .markdown-content pre code {
                        @apply bg-transparent px-0 py-0 text-gray-800;
                    }
                    .markdown-content blockquote {
                        @apply border-l-4 border-blue-500 pl-4 py-2 mb-4 bg-blue-50 text-gray-700;
                    }
                    .markdown-content table {
                        @apply w-full border-collapse border border-gray-300 mb-4;
                    }
                    .markdown-content th, .markdown-content td {
                        @apply border border-gray-300 px-4 py-2 text-left;
                    }
                    .markdown-content th {
                        @apply bg-gray-100 font-semibold;
                    }
                </style>
            </head>
            <body class="bg-gray-50 min-h-screen">
                <div class="container mx-auto px-6 py-8 max-w-4xl">
                    <div class="bg-white rounded-lg shadow-lg p-8">
                        <div class="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
                            <h1 class="text-2xl font-bold text-gray-900">${displayName}</h1>
                            <button onclick="window.close()" 
                                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                Close
                            </button>
                        </div>
                        <div class="markdown-content">
                            ${htmlContent}
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        
        newWindow.document.close();
        newWindow.focus();
    }

})(); 