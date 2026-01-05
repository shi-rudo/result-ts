import { defineConfig } from 'tsdown'

const isProd = process.env.NODE_ENV === 'production'

export default defineConfig({
    // Single public entrypoint.
    entry: ['./src/index.ts'],
    // Emit ESM and CJS; keep ESM platform-neutral for browser usage.
    format: {
        esm: {
            target: ['es2022'],
            platform: 'neutral',
        },
        cjs: {
            target: ['node20'],
        },
    },
    // Generate JS sourcemaps for easier debugging in consumers.
    sourcemap: true,
    // Clean dist before build to avoid stale artifacts.
    clean: true,
    // Minify only for production builds.
    minify: isProd,
    // Emit type declarations with sourcemaps.
    dts: {
        sourcemap: true,
    }
})
