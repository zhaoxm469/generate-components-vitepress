import chalk from 'chalk'
import minimist from 'minimist'
import path from 'path'
import { createServer, build, serve, TempFileName, genTemporary } from './index'

const argv: any = minimist(process.argv.slice(2))

console.log(chalk.cyan(`vitepress v${require('../../package.json').version}`))
console.log(chalk.cyan(`vite v${require('vite/package.json').version}`))

const command = argv._[0]
let root = argv._[command ? 1 : 0]
argv.root = path.join(root ?? argv.root ?? process.cwd(), TempFileName)
// 在这里通过用户script 命令传入的 选项，来找到root路径 ， 通过运行的时候 我们可以看到 node ./bin/gc-vitepress dev docs --host ， 用户传入的docs
// 所以 root = docs/{TempFileName} = docs/.temp
root = argv.root

console.log('root = ' + argv.root)

async function run() {
  // 生成文档文件到 .temp 目录
  await genTemporary(argv, command === 'dev')

  if (!command || command === 'dev') {
    createServer(root, argv)
      .then((server) => server.listen())
      .then((server) => {
        server.printUrls()
      })
      .catch((err) => {
        console.error(chalk.red(`failed to start server. error:\n`), err)
        process.exit(1)
      })
  } else if (command === 'build') {
    build(root, argv).catch((err) => {
      console.error(chalk.red(`build error:\n`), err)
      process.exit(1)
    })
  } else if (command === 'serve') {
    serve(argv).catch((err) => {
      console.error(chalk.red(`failed to start server. error:\n`), err)
      process.exit(1)
    })
  } else {
    console.log(chalk.red(`unknown command "${command}".`))
    process.exit(1)
  }
}

run()
