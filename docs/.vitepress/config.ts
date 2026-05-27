import { defineConfig } from 'vitepress';

export default defineConfig({
    title: '@shirudo/result',
    description: 'Robust, type-safe error handling for TypeScript.',
    base: process.env.DOCS_BASE ?? '/',
    cleanUrls: true,
    themeConfig: {
        nav: [
            { text: 'Guide', link: '/guide/getting-started' },
            { text: 'API', link: '/api/result' },
            { text: 'Migration', link: '/migration/v1' },
            { text: 'Roadmap', link: '/roadmap/state-of-the-art' },
            { text: 'GitHub', link: 'https://github.com/shi-rudo/result-ts' },
        ],
        sidebar: [
            {
                text: 'Guide',
                items: [
                    { text: 'Getting Started', link: '/guide/getting-started' },
                    { text: 'Pipelines', link: '/guide/pipelines' },
                    { text: 'Task Notation', link: '/guide/task' },
                    { text: 'Pattern Matching', link: '/guide/matching' },
                ],
            },
            {
                text: 'API Reference',
                items: [
                    { text: 'Result', link: '/api/result' },
                    { text: 'Operators', link: '/api/operators' },
                    { text: 'Collections', link: '/api/collections' },
                    { text: 'Error Classes', link: '/api/errors' },
                ],
            },
            {
                text: 'Migration',
                items: [{ text: 'Version 1', link: '/migration/v1' }],
            },
            {
                text: 'Roadmap',
                items: [{ text: 'State of the Art', link: '/roadmap/state-of-the-art' }],
            },
        ],
        search: {
            provider: 'local',
        },
    },
});
