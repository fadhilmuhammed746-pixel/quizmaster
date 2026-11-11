import { copyFile, mkdir } from 'node:fs/promises'

const source = 'android/app/build/outputs/apk/debug/app-debug.apk'
const destination = 'public/downloads/quizverse.apk'

await mkdir('public/downloads', { recursive: true })
await copyFile(source, destination)
console.log(`Android APK copied to ${destination}`)
