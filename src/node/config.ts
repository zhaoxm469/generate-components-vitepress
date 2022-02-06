import path from 'path'
import fs from 'fs-extra'
import chalk from 'chalk'
import globby from 'globby'
import { AliasOptions, Plugin } from 'vite'
import { Options as VuePluginOptions } from '@vitejs/plugin-vue'
import { SiteData, HeadConfig, LocaleConfig } from '../../types/shared'
export { resolveSiteDataByRoute } from './shared/config'
import { resolveAliases, APP_PATH, DEFAULT_THEME_PATH } from './alias'
import { MarkdownOptions } from './markdown/markdown'

const debug = require('debug')('vitepress:config')

export interface UserConfig<ThemeConfig = any> {
  lang?: string
  base?: string
  title?: string
  version?: string;
  description?: string
  head?: HeadConfig[]
  themeConfig?: ThemeConfig
  locales?: Record<string, LocaleConfig>
  alias?: Record<string, string>
  markdown?: MarkdownOptions
  outDir?: string
  // 侧边栏文件路径
  sidebarPath: string[] | string
  // src
  srcIncludes?: string[]
  customData?: any
  vueOptions?: VuePluginOptions
  vitePlugins?: Plugin[]
  importMap?: Record<string, string>
}

export interface SiteConfig<ThemeConfig = any> {
  root: string
  site: SiteData<ThemeConfig>
  configPath: string
  themeDir: string
  outDir: string
  tempDir: string
  alias: AliasOptions
  pages: string[]
  userConfig: UserConfig
  markdown?: MarkdownOptions
  vueOptions?: VuePluginOptions
  vitePlugins?: Plugin[]
}

const resolve = (root: string, file: string) =>
  path.resolve(root, `.vitepress`, file)

export async function resolveConfig(root: string): Promise<SiteConfig> {
  // 获取站点数据
  const site = await resolveSiteData(root)

  // resolve theme path
  const userThemeDir = resolve(root, 'theme')
  const themeDir = (await fs.pathExists(userThemeDir))
    ? userThemeDir
    : DEFAULT_THEME_PATH

  // 获取用户传入的配置
  const userConfig = await resolveUserConfig(root)

  // 生成新的配置数据
  const config: SiteConfig = {
    root,
    site,
    themeDir,
    pages: await globby(['**.md'], {
      cwd: root,
      ignore: ['node_modules', '**/node_modules']
    }),
    configPath: resolve(root, 'config.js'),
    outDir: path.resolve(root, '../', userConfig.outDir ?? 'dist'),
    tempDir: path.resolve(APP_PATH, 'temp'),
    userConfig,
    markdown: userConfig.markdown,
    alias: resolveAliases(themeDir, userConfig),
    vueOptions: userConfig.vueOptions,
    vitePlugins: userConfig.vitePlugins
  }

  return config
}

export async function resolveUserConfig(root: string) {
  // load user config
  const configPath = resolve(root, 'config.js')
  // 判断是否有这个文件
  const hasUserConfig = await fs.pathExists(configPath)
  // always delete cache first before loading config
  delete require.cache[configPath]
  // 如果没有找到 设置 = {} 占位
  const userConfig: UserConfig = hasUserConfig ? require(configPath) : {}

  if (hasUserConfig) {
    debug(`loaded config at ${chalk.yellow(configPath)}`)
  } else {
    // 如果不存在配置信息，提示报错
    debug(`no config file found.`)
  }

  return userConfig
}

export async function resolveSiteData(root: string): Promise<SiteData> {
  // 获取 docs/.temp/config.js 文件信息
  const userConfig = await resolveUserConfig(root)

  return {
    lang: userConfig.lang || 'en-US',
    title: userConfig.title || 'VitePress',
    version: userConfig.version || 'VitePress',
    description: userConfig.description || '',
    base: userConfig.base ? userConfig.base.replace(/([^/])$/, '$1/') : '/',
    head: userConfig.head || [],
    themeConfig: userConfig.themeConfig || {},
    locales: userConfig.locales || {},
    customData: userConfig.customData || {}
  }
}
