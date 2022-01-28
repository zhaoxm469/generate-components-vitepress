import { createServer as createViteServer, ServerOptions } from 'vite'
import { resolveConfig } from './config'
import { createVitePressPlugin } from './plugin'

export async function createServer(
  // 默认执行命令的所在目录
  root: string = process.cwd(),
  serverOptions: ServerOptions
) {
  // 获取配置项
  const config = await resolveConfig(root)

  // 修复 vite 2.7.0 版本对fs文件读取的限制
  serverOptions.fs = {}
  serverOptions['fs']['strict'] = false

  return createViteServer({
    root,
    base: config.site.base,
    // logLevel: 'warn',
    plugins: createVitePressPlugin(root, config),
    server: serverOptions
  })
}
