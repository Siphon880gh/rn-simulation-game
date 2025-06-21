// Docs functionality for displaying markdown files from docs/ directory with nested categories
(function() {
    'use strict';

    // Documentation structure with categories and files
    const docsStructure = {
        'devs': {
            displayName: 'Developers',
            icon: 'code',
            color: 'text-purple-500',
            files: [
                'MEDICATION_WINDOW_MECHANICS.md',
                'README_UTILS.md',
                'REFACTORING_SUMMARY.md'
            ]
        },
        'players': {
            displayName: 'Players',
            icon: 'users',
            color: 'text-green-500',
            files: [
                'ABOUT.md'
            ]
        }
    };

    // Track expanded categories
    let expandedCategories = new Set();

    // Initialize docs functionality when DOM is ready
    $(document).ready(function() {
        initializeDocsDropdown();
        loadNestedDocsList();
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

    function loadNestedDocsList() {
        const docsList = $('#docs-list');
        docsList.empty();

        // Create categories
        Object.keys(docsStructure).forEach(function(categoryKey) {
            const category = docsStructure[categoryKey];
            const isExpanded = expandedCategories.has(categoryKey);
            
            const categoryItem = createCategoryItem(categoryKey, category, isExpanded);
            docsList.append(categoryItem);

            // Add files for this category
            if (isExpanded && category.files.length > 0) {
                category.files.forEach(function(filename) {
                    const fileItem = createFileItem(filename, categoryKey);
                    docsList.append(fileItem);
                });
            }
        });
    }

    function createCategoryItem(categoryKey, category, isExpanded) {
        const expandIcon = isExpanded ? 'chevron-down' : 'chevron-right';
        const categoryIcon = getCategoryIcon(category.icon);
        
        return $(`
            <div class="category-item px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50 cursor-pointer flex items-center gap-3 border-b border-gray-100"
                 data-category="${categoryKey}">
                <div class="flex items-center gap-2 flex-1">
                    ${categoryIcon}
                    <span class="${category.color}">${category.displayName}</span>
                    <span class="text-xs text-gray-400">(${category.files.length})</span>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-${expandIcon} text-gray-400 transition-transform duration-200">
                    ${getChevronPath(expandIcon)}
                </svg>
            </div>
        `);
    }

    function createFileItem(filename, categoryKey) {
        const displayName = formatDisplayName(filename);
        const fileIcon = getFileIcon(filename);
        
        return $(`
            <div class="file-item pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-blue-50 cursor-pointer flex text-left gap-2 border-l-2 border-transparent hover:border-blue-300"
                 data-filename="${filename}" data-category="${categoryKey}">
                ${fileIcon}
                <span>${displayName}</span>
            </div>
        `);
    }

    function getCategoryIcon(iconType) {
        const icons = {
            'code': `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-code text-purple-500">
                    <polyline points="16 18 22 12 16 6"></polyline>
                    <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
            `,
            'users': `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-users text-green-500">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            `
        };
        return icons[iconType] || icons['code'];
    }

    function getFileIcon(filename) {
        // Different icons based on file type/name
        if (filename.toLowerCase().includes('about')) {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-info text-blue-500">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M12 16v-4"></path>
                    <path d="M12 8h.01"></path>
                </svg>
            `;
        } else if (filename.toLowerCase().includes('readme')) {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-book-open text-amber-500">
                    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
            `;
        } else {
            return `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                     stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="lucide lucide-file-text text-gray-500">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            `;
        }
    }

    function getChevronPath(iconType) {
        if (iconType === 'chevron-down') {
            return '<polyline points="6 9 12 15 18 9"></polyline>';
        } else {
            return '<polyline points="9 18 15 12 9 6"></polyline>';
        }
    }

    function setupEventListeners() {
        // Handle clicking on category items (expand/collapse)
        $(document).on('click', '.category-item', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent dropdown from closing
            const categoryKey = $(this).data('category');
            toggleCategory(categoryKey);
        });

        // Handle clicking on file items
        $(document).on('click', '.file-item', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Prevent any unwanted bubbling
            const filename = $(this).data('filename');
            const categoryKey = $(this).data('category');
            openMarkdownInNewWindow(filename, categoryKey);
            $('#docs-dropdown').addClass('hidden');
        });
    }

    function toggleCategory(categoryKey) {
        if (expandedCategories.has(categoryKey)) {
            expandedCategories.delete(categoryKey);
        } else {
            expandedCategories.add(categoryKey);
        }
        loadNestedDocsList();
    }

    function formatDisplayName(filename) {
        // Convert filename to a more readable format
        return filename
            .replace('.md', '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    function openMarkdownInNewWindow(filename, categoryKey) {
        // Fetch the markdown file from the appropriate category folder
        fetch(`../docs/${categoryKey}/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch ${filename}: ${response.statusText}`);
                }
                return response.text();
            })
            .then(markdownContent => {
                const htmlContent = marked.parse(markdownContent);
                const categoryInfo = docsStructure[categoryKey];
                createDocumentWindow(filename, htmlContent, categoryInfo);
            })
            .catch(error => {
                console.error('Error loading markdown file:', error);
                alert(`Error loading ${filename}. Please check if the file exists in the ${categoryKey} folder.`);
            });
    }

    function createDocumentWindow(filename, htmlContent, categoryInfo) {
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
                <title>${displayName} - ${categoryInfo.displayName} Documentation</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <script>
                    tailwind.config = {
                        corePlugins: {
                            preflight: false, // Disable Tailwind's CSS reset
                        }
                    }
                </script>
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
                            <div class="flex items-center gap-3">
                                <span class="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 ${categoryInfo.color}">
                                    ${categoryInfo.displayName}
                                </span>
                                <h1 class="text-2xl font-bold text-gray-900">${displayName}</h1>
                            </div>
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