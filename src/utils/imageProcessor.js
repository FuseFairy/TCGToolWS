import { wrap } from 'comlink'
import { cropSpriteImage as mainThreadProcessor } from './mainThreadImageProcessor.js'
import { createConcurrencyLimiter } from './concurrencyLimiter.js'

const limiter = createConcurrencyLimiter(20)

let underlyingProcessor

const supportsWorker = !!window.Worker

if (supportsWorker) {
  console.log('Environment supports Web Workers. Using Worker-based image processor.')
  const worker = new Worker(new URL('../workers/imageProcessor.worker.js', import.meta.url), {
    type: 'module',
  })
  underlyingProcessor = wrap(worker)
} else {
  console.warn('Environment does not support Web Workers. Falling back to main-thread processor.')
  underlyingProcessor = {
    crop: mainThreadProcessor,
  }
}

const processor = {
  /**
   * @param {string} url
   * @param {object} coords
   * @returns {Promise<Blob>}
   */
  crop: (url, coords) => {
    return limiter.add(() => underlyingProcessor.crop(url, coords))
  },
}

export default processor
