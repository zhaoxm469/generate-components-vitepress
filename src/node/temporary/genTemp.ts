import fsExtra from 'fs-extra'
import { resolveConfig, ServeOptions } from '../index'
import { LocaleConfig } from '/@types/shared'
import { copyAndWatchRoot, copyAndWatchSrc } from './copy'
import { join } from 'path'
import chalk from 'chalk'

export const TempFileName = '.temp'
export const DefaultSrcIncludes = ['src']

// generate a .temp dir
export async function genTemporary(options: ServeOptions = {}, watch: boolean) {
  const root = options.root!
  const config = await resolveConfig(join(root, '..'))
  const userConfig = config.userConfig

  if (!userConfig.sidebarPath) {
    console.error(chalk.red(`vitepress/config.js sidebarPath is undefined`))
    process.exit(1)
  } else if (Array.isArray(userConfig.sidebarPath)) {
    console.error(chalk.red(`vitepress/config.js sidebarPath is Array`))
    process.exit(1)
  }

  const langToPathMapping = getLangToPathMapping(
    userConfig.locales ?? userConfig.themeConfig?.locales,
    config.userConfig.lang
  )

  const {
    userConfig: { srcIncludes: srcIncludes = DefaultSrcIncludes }
  } = config

  await fsExtra.remove(root)
  await fsExtra.ensureDir(root)

  await Promise.all([
    // 复制目录文件，并且监听docs 目录文件发生变化， srcIncludes 传入的路文件变化
    copyAndWatchRoot(root, langToPathMapping, watch, userConfig),
    // 监听用户传入路径文件发生变化
    copyAndWatchSrc(root, srcIncludes, langToPathMapping, watch, userConfig)
  ])

  console.log('copy to .temp success.')
}

// resolve a mapping from localeConfig
// like { 'zh-CN: '/', 'en-US': '/en/', '': '/' }
function getLangToPathMapping(
  locale: Record<string, LocaleConfig> | undefined,
  lang: string | undefined
) {
  if (!locale) {
    return null
  }
  const mapping = Object.entries(locale).reduce((map, [path, localeConfig]) => {
    map[localeConfig.lang] = path.slice(1)
    return map
  }, {} as Record<string, string>)

  // ensure default lang
  let defaultLangPrefix
  if (lang && mapping[lang]) {
    defaultLangPrefix = mapping[lang]
  } else {
    defaultLangPrefix = Object.values(mapping)[0]
  }
  mapping[''] = defaultLangPrefix

  return mapping
}
