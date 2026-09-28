import type { Theme } from 'vitepress'
import Layout from './Layout.vue'
import ExecArchitectureFigure from './components/figures/ExecArchitectureFigure.vue'
import ExecTaskAttemptFigure from './components/figures/ExecTaskAttemptFigure.vue'
import ExecWorkflowGraphFigure from './components/figures/ExecWorkflowGraphFigure.vue'
import './style.css'

export default {
  Layout,
  // Figures used from Markdown have to be registered globally.
  enhanceApp({ app }) {
    app.component('ExecArchitectureFigure', ExecArchitectureFigure)
    app.component('ExecWorkflowGraphFigure', ExecWorkflowGraphFigure)
    app.component('ExecTaskAttemptFigure', ExecTaskAttemptFigure)
  },
} satisfies Theme
