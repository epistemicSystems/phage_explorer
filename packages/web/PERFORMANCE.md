# Performance Characteristics & Browser Compatibility

## Performance Targets

### Load Time
| Connection | Target FCP | Target LCP | Target TTI |
|------------|-----------|-----------|-----------|
| Fast (4G+) | < 500ms | < 1000ms | < 1500ms |
| 3G | < 2000ms | < 3000ms | < 4000ms |
| Slow 3G | < 4000ms | < 6000ms | < 8000ms |

### Runtime Performance
| Metric | Target | Notes |
|--------|--------|-------|
| Scroll FPS | 60fps sustained | > 55fps minimum acceptable |
| Touch Response | < 100ms | Input-to-paint latency |
| Comparison (50kb) | < 500ms | Two-phage alignment |
| Analysis Overlays | < 200ms | GC skew, complexity, etc. |
| Memory Baseline | < 100MB | Initial heap after load |
| Memory (30min) | < 300MB | After extended session |

### Mobile Device Targets
| Device Class | Example | TTI Target | Memory Target |
|--------------|---------|-----------|---------------|
| Low-end | iPhone SE 1st gen, Budget Android | < 8000ms | < 50MB |
| Mid-range | iPhone SE 3rd gen, Pixel 4a | < 5000ms | < 75MB |
| Flagship | iPhone 14/15, Pixel 7+ | < 2000ms | < 100MB |
| Tablet | iPad Mini, iPad Air | < 3000ms | < 100MB |

## Browser Compatibility

### Fully Supported
| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full feature support including WebGPU |
| Edge | 90+ | Chromium-based, same as Chrome |
| Safari | 15+ | WebGPU via Metal on macOS/iOS 17+ |
| Firefox | 100+ | WebGPU behind flag, WASM full support |

### Feature Support Matrix
| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| WASM | Yes | Yes | Yes | Yes |
| SharedArrayBuffer | Yes | Yes | Yes* | Yes |
| WebGPU | Yes | Flag | 17+ | Yes |
| OffscreenCanvas | Yes | Yes | Partial | Yes |
| Web Workers | Yes | Yes | Yes | Yes |

*Safari requires cross-origin isolation headers

### Fallback Behavior
- **No WebGPU**: Falls back to Canvas 2D rendering
- **No WASM**: Falls back to JavaScript implementations (slower)
- **No SharedArrayBuffer**: Single-threaded analysis (progressive)

## Running Benchmarks

```bash
# Full performance benchmark suite
bunx playwright test e2e/performance-benchmark.e2e.ts --project=chromium

# Mobile device tests
bunx playwright test e2e/mobile-performance.e2e.ts --project=chromium

# Specific test
bunx playwright test e2e/performance-benchmark.e2e.ts -g "Load Time"
```

### Benchmark Output
Results are logged to console with pass/fail indicators:
- FCP, LCP, TTI metrics
- Scroll frame timing
- Memory usage over time
- Analysis computation timing

## Optimization Techniques Used

### Load Performance
- **Code splitting**: Route-based lazy loading
- **Tree shaking**: Unused code elimination
- **Asset optimization**: Image compression, font subsetting
- **Preloading**: Critical resources prefetched

### Runtime Performance
- **Virtualization**: Only visible sequences rendered
- **Memoization**: React.memo, useMemo for expensive computations
- **Web Workers**: Analysis computations off main thread
- **WASM**: Sequence alignment and analysis in compiled code

### Memory Management
- **Cleanup on navigation**: Event listeners, timers, subscriptions
- **Windowing**: Only visible data in memory
- **Lazy loading**: Data fetched on demand

### Rendering
- **Canvas optimization**: Batch drawing, layer caching
- **CSS containment**: Isolate layout recalculations
- **GPU acceleration**: Transform/opacity animations only
- **Debouncing**: Scroll/resize handlers throttled

## Known Limitations

1. **Large genomes (>500kb)**: May experience slower scroll on low-end devices
2. **Many overlays**: 3+ overlays may reduce FPS
3. **Safari WASM**: Slightly slower than Chrome
4. **Firefox WebGPU**: Requires manual flag enable

## Monitoring in Production

Performance is tracked via:
- Web Vitals (FCP, LCP, CLS, FID)
- Custom timing marks for analysis operations
- Memory profiling for extended sessions

## Contributing

When adding features:
1. Profile before/after with DevTools
2. Run benchmark suite to verify no regressions
3. Test on mobile viewport (375px width minimum)
4. Document any new performance considerations
