import { pdfjs } from 'react-pdf'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

// Point pdf.js at the bundled worker (required). Vite emits the worker file
// and hands us its URL via the `?url` import.
pdfjs.GlobalWorkerOptions.workerSrc = workerUrl
