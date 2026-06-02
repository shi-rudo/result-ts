import { defineConfig, type UserConfig } from 'tsdown'

const isProd = process.env.NODE_ENV === 'production'

const config: UserConfig = defineConfig({
    entry: {
        index: './src/index.ts',
        errors: './src/errors.ts',
        operators: './src/operators.ts',
        collections: './src/collections.ts',
    },
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

export default config
