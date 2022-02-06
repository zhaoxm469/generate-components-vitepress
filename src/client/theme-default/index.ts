import './styles/vars.css'
import './styles/layout.css'
import './styles/code.css'
import './styles/custom-blocks.css'
import './styles/markdown.css'
import './styles/reset.css'
import './styles/sidebar-links.css'
import './styles/element-plus@1.3.0-beta.10.css';


import { Theme } from 'vitepress'
import Layout from './Layout.vue'
import NotFound from './NotFound.vue'

const theme: Theme = {
  Layout,
  NotFound,
}

export default theme
