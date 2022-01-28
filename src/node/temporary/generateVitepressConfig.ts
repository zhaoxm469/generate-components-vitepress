/*
 * @Author: zhaoxingming
 * @Date: 2022-01-22 17:45:21
 * @LastEditTime: 2022-01-26 23:56:52
 * @LastEditors: vscode
 * @Description: 通过用户传入的 侧边栏路由，重新生成.templ/viewpress/config.js
 *
 */
import fs from 'fs'
import traverse from 'babel-traverse'
import { parse } from 'babylon'
import generate from 'babel-generator'
const t = require('@babel/types')
import { writeFileSync } from 'fs-extra'

// const { existsSync, ensureFileSync ,writeFileSync} = require('fs-extra');

// const navConfigPath = resolve(__dirname,'../packages/nav.config.json')
// const vitepressConfigPath = resolve(__dirname, '../docs/.vitepress/config.js')
// const vitepressTempConfigPath = resolve(__dirname, '../docs/.temp/.vitepress/config.js')

// 生成新的Vitepress/config.js 文件
export const generatorVitepressConfig = (
  sidebarPath: string | string[],
  rawVitepressConfigPath: string,
  destVitepressConfigPath: string
) => {
  try {
    // 如果是数组情况没做处理，后续在处理
    if (typeof sidebarPath === 'string') {
      var navConfigData = JSON.parse(fs.readFileSync(sidebarPath, 'utf-8'))
    }
  } catch (err) {
    console.log('出错了')
    console.log(err)
    process.exit()
  }

  const vitepressConfigCode = fs.readFileSync(rawVitepressConfigPath, 'utf-8')

  const ast = parse(vitepressConfigCode)

  traverse(ast, {
    Identifier(path: any) {
      if (path.node.name === 'sidebar') {
        const elements = path.parent.value.elements

        navConfigData.navs.forEach(
          (item: {
            children: { text: string; cName: string; link: any }[]
            text: any
          }) => {
            item.children = item.children.filter((item: any) => item.show)
            if (!item.children.length) return

            let child: any[] = []
            let arr = [
              t.objectProperty(
                t.identifier('text'),
                t.stringLiteral(item.text)
              ),
              t.objectProperty(
                t.identifier('children'),
                t.arrayExpression(child)
              )
            ]
            item.children.forEach(
              (it: { text: string; cName: string; link: any }) => {
                child.push(
                  t.objectExpression([
                    t.objectProperty(
                      t.identifier('text'),
                      t.stringLiteral(it.text + ' ' + it.cName)
                    ),
                    t.objectProperty(
                      t.identifier('link'),
                      t.stringLiteral(it.link)
                    )
                  ])
                )
              }
            )
            elements.push(t.objectExpression(arr))
          }
        )
      }
    }
  })

  // 生成的新的 vitepress/config.js文件
  const newCode = generate(ast).code

  writeFileSync(destVitepressConfigPath, newCode)
}
