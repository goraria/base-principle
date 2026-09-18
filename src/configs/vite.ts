// import { existsSync } from "fs"
// import { readFile } from "fs/promises"
// import { basename, relative, resolve } from "path"
// import pc from "picocolors"
// import { Logger } from "@/lib/logger"
// import {
//   version as viteVersion,
//   type Plugin,
//   type ViteDevServer,
//   type HmrContext,
//   type ModuleNode,
// } from "vite"

// const runtime = globalThis as typeof globalThis & {
//   development?: {
//     started: boolean
//     reloadFile?: string
//     reloadStartedAt?: number
//   }
// }

// const runtimeState = (runtime.development ??= {
//   started: false,
// })

// const configLoadedAt = performance.now()
// const rootPath = resolve(import.meta.dirname, "..")
// const indexPath = resolve(rootPath, "assets", "index.html")
// const serverEntry = "/app/main.ts"

// function environmentFiles(mode: string): string {
//   return [".env", ".env.local", `.env.${mode}`, `.env.${mode}.local`]
//     .filter((file) => existsSync(resolve(rootPath, file)))
//     .join(", ")
// }

// function isServerReloadFile(file: string): boolean {
//   const filename = basename(file)

//   return (
//     filename === "vite.config" ||
//     filename.startsWith("vite.config.") ||
//     filename === ".env" ||
//     filename.startsWith(".env.")
//   )
// }

// function formatFile(file: string): string {
//   const relativeFile = relative(rootPath, file)

//   return relativeFile.startsWith("..") ? basename(file) : relativeFile
// }

// function printServerStarted(server: ViteDevServer, mode: string): void {
//   const urls = server.resolvedUrls
//   const address = server.httpServer?.address()

//   const fallbackUrl =
//     typeof address === "object" && address
//       ? `http://localhost:${address.port}/`
//       : "unavailable"

//   const localUrl = urls?.local[0] ?? fallbackUrl
//   const networkUrl = urls?.network[0] ?? "unavailable"
//   const environments = environmentFiles(mode) || "none"
//   const readyIn = Math.round(performance.now() - configLoadedAt)

//   console.log(`${pc.blue(`▼ Vite.js ${viteVersion}`)} (Express.js 5.2.1)`)
//   console.log(`- Local:         ${localUrl}`)
//   console.log(`- Network:       ${networkUrl}`)
//   console.log(`- Environments: ${environments}`)
//   console.log(Logger(`Ready in ${readyIn}ms`, "success", "green"))
//   console.log(Logger(`Running vite.config.ts took ${readyIn}ms`, "success", "green"))
//   console.log()
// }

// function printServerReloaded(): void {
//   const reloadStartedAt = runtimeState.reloadStartedAt ?? configLoadedAt

//   const reloadTime = Math.round(performance.now() - reloadStartedAt)

//   const file = runtimeState.reloadFile ? ` ${runtimeState.reloadFile}` : ""

//   console.log(
//     Logger(`Server reloaded${file} in ${reloadTime}ms`, "success", "green")
//   )

//   runtimeState.reloadFile = undefined
//   runtimeState.reloadStartedAt = undefined
// }

// export function configureDevelopmentServer(server: ViteDevServer): void {
//   const handleWatcherEvent = (event: string, file: string): void => {
//     if (
//       !["add", "change", "unlink"].includes(event) ||
//       !isServerReloadFile(file)
//     ) {
//       return
//     }

//     runtimeState.reloadFile = formatFile(file)
//     runtimeState.reloadStartedAt = performance.now()
//   }

//   server.watcher.on("all", handleWatcherEvent)

//   server.httpServer?.once("close", () => {
//     server.watcher.off("all", handleWatcherEvent)
//   })

//   server.httpServer?.once("listening", () => {
//     setTimeout(() => {
//       if (runtimeState.started) {
//         printServerReloaded()
//         return
//       }

//       runtimeState.started = true
//       printServerStarted(server, server.config.mode)
//     }, 0)
//   })

//   server.middlewares.use(async (req, res, next) => {
//     const pathname = new URL(req.url ?? "/", "http://localhost").pathname

//     if (req.method !== "GET" || pathname !== "/") {
//       next()
//       return
//     }

//     try {
//       const source = await readFile(indexPath, "utf8")
//       const html = await server.transformIndexHtml(pathname, source)

//       res.statusCode = 200
//       res.setHeader("Content-Type", "text/html; charset=utf-8")
//       res.end(html)
//     } catch (error) {
//       next(error)
//     }
//   })

//   server.middlewares.use(async (req, res, next) => {
//     try {
//       const { default: bootstrap } = await server.ssrLoadModule(serverEntry)

//       await bootstrap(req, res, next)
//     } catch (error) {
//       if (error instanceof Error) {
//         server.ssrFixStacktrace(error)
//       }

//       next(error)
//     }
//   })
// }

// export function configureHotUpdateServer(
//   context: HmrContext
// ): ModuleNode[] | undefined {
//   if (isServerReloadFile(context.file)) {
//     return
//   }

//   const file = formatFile(context.file)
//   const elapsed = Math.max(0, Date.now() - context.timestamp)

//   console.log(
//     Logger(`Server updated ${file} in ${elapsed}ms`, "success", "green")
//   )

//   return context.modules
// }

// export const developmentServerPlugin: Plugin = {
//   name: "express-development-server",
//   apply: "serve",

//   configureServer(server) {
//     return configureDevelopmentServer(server)
//   },

//   handleHotUpdate(context) {
//     return configureHotUpdateServer(context)
//   },
// }
