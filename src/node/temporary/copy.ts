import { UserConfig } from './../config'
import { generatorVitepressConfig } from './generateVitepressConfig'
import matter from 'gray-matter'
import { clearSuffix } from '../utils/parseHeader'
import globby from 'globby'
import fsExtra from 'fs-extra'
import { basename, extname, join } from 'path'
import { TempFileName } from './genTemp'
import chokidar from 'chokidar'

// copy userConfig.srcIncludes (default to ['src']) *.md to .temp
// dest file is frontmatter.map?.path or real path at .temp
export async function copyAndWatchSrc(
  root: string,
  srcIncludes: string[],
  langToPathMapping: Record<string, string> | null,
  watch = true,
  userConfig: UserConfig
) {
  const srcPaths = srcIncludes.map((src) => `${clearSuffix(src)}/**/*.md`)
  const files = await globby(srcPaths, {
    dot: true,
    cwd: process.cwd(),
    ignore: ['node_modules', '**/node_modules']
  })

  async function injectMatterAndCopy(file: string, isRemove?: boolean) {
    const fileBuffer = await fsExtra.readFile(file)
    const { data: frontmatter, content } = matter(fileBuffer)

    const fileName = basename(file)
    let destPath = file
    if (frontmatter.map?.path) {
      destPath = frontmatter.map?.path
      // maybe path includes fileName
      if (!destPath.endsWith(fileName)) {
        destPath = join(destPath, fileName)
      }
    }
    frontmatter.map = {
      ...frontmatter.map,
      realPath: file
    }
    const destFile = join(root, tolocalePath(langToPathMapping, destPath))

    if (isRemove) {
      // console.log('remove' + destFile)
      await fsExtra.remove(destFile)
    } else {
      // console.log(file + ' -> ' + destFile)
      await fsExtra.ensureFile(destFile)
      await fsExtra.writeFile(destFile, matter.stringify(content, frontmatter))
    }
  }

  await Promise.all(files.map((file) => injectMatterAndCopy(file)))

  if (watch) {
    chokidar
      .watch(srcPaths, {
        cwd: process.cwd(),
        ignored: ['node_modules', '**/node_modules']
      })
      .on('change', (file) => injectMatterAndCopy(file))
      .on('add', (file) => injectMatterAndCopy(file))
      .on('unlink', (file) => injectMatterAndCopy(file, true))
  }
}

// copy all file at root to .temp dir
export async function copyAndWatchRoot(
  root: string,
  langToPathMapping: Record<string, string> | null,
  watch = true,
  userConfig: UserConfig
) {
  const docsPath = join(root, '..')
  const files = await globby([`**`, `!${TempFileName}`, '!dist'], {
    dot: true,
    cwd: docsPath
  })

  const sidebarPath = Array.isArray(userConfig.sidebarPath)
    ? userConfig.sidebarPath.map((path) => path)
    : [userConfig.sidebarPath]

  async function copyFile(file: string, isRemove?: boolean) {
    const descFile = join(root, tolocalePath(langToPathMapping, file))
    const docsFilePath = join(docsPath, file)

    if (isRemove) {
      // console.log('remove ' + descFile)
      return fsExtra.remove(descFile)
    } else {
      // 根据sidebarPath + docs/vitepress/config 组合生成新的 config 文件到 .temp/viewpress/config.js
      if (descFile.includes('.vitepress/config.js')) {
        await fsExtra.copy(docsFilePath, descFile)

        return generatorVitepressConfig(
          sidebarPath[0],
          docsFilePath,
          join(process.cwd(), descFile)
        )
      }
      return fsExtra.copy(docsFilePath, descFile)
    }
  }

  await Promise.all(files.map((file) => copyFile(file)))

  // 监听用户传入的sidebarPath侧边栏路由发生变化
  chokidar.watch([...sidebarPath]).on('change', (file) => {
    return generatorVitepressConfig(
      file,
      join(docsPath, '.vitepress/config.js'),
      join(process.cwd(), 'docs/.temp/.vitepress/config.js')
    )
  })

  if (watch) {
    chokidar
      .watch(['.'], {
        cwd: docsPath,
        ignored: [`${TempFileName}`, 'dist']
      })
      .on('change', (file) => copyFile(file))
      .on('add', (file) => copyFile(file))
      .on('unlink', (file) => copyFile(file, true))
  }
}

// resolve /comp/foo.zh-CN.md -> /zh/comp/foo.md
function tolocalePath(mapping: Record<string, string> | null, path: string) {
  // { 'en-US': '', 'zh-CN': 'zh/', '': '' }
  if (!mapping) {
    return path
  }
  const fileName = basename(path)
  // .md
  const ext = extname(fileName)
  // .zh-CN
  const lang = extname(fileName.slice(0, -ext.length))
  // en/
  const langPrefix = mapping[lang.slice(1)]

  if (!(lang.slice(1) in mapping)) {
    return path
  }
  return `${langPrefix}${path.slice(0, -(ext + lang).length)}${ext}`
}
