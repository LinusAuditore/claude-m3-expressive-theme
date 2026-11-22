import type { Register, ThemeSetArgs } from 'claude-code'

import { makeColors } from './make-colors.js'
import { SCENE } from './scene'

// Material 3 Expressive: white by day, deep space gray by night, with the
// classic red, yellow, blue and green as the roles.
const { theme, problems } = makeColors({
  label: 'M3 Expressive',
  roles: { accent: '#3f7fea', danger: '#e2463c', success: '#2e9e57', warning: '#e0a100', pro: '#7a5ae0' },
  light: {
    gray: {
      anchors: {
        'surface-0': '#f7f8fa',
        'surface-1': '#fcfcfd',
        'surface-2': '#ffffff',
        'surface-3': '#ffffff',
        'text-primary': '#1b1c1f',
        'text-secondary': '#44474e',
        'text-muted': '#5d6068',
      },
    },
  },
  dark: {
    gray: {
      anchors: {
        'surface-0': '#16171b',
        'surface-1': '#1c1d22',
        'surface-2': '#222328',
        'surface-3': '#28292f',
        'text-primary': '#e8e9ed',
        'text-secondary': '#c3c5cc',
        'text-muted': '#9da0a8',
      },
    },
  },
})

const SCENE_NAME = 'm3-expressive-shapes'

const LOOK: ThemeSetArgs = {
  colors: theme,
  // Frosted panels keep the conversation calm over the moving shapes.
  backdrop: { scene: SCENE_NAME, glass: { blur: 20, opacity: 0.72 } },
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const unpainted = problems.find(line => line.startsWith("Desktop won't paint"))

    if (unpainted !== undefined) {
      $.ui.toast(unpainted)
    }
    const set = await $.theme.set(LOOK)

    if (!set.isDrawn) {
      $.ui.status(set.reason)
    }

    return next(e)
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'mobile') || e.props.scene !== SCENE_NAME) {
      return next(e)
    }
    const { Svg } = $.ui.resolve(e)

    return (
      <Svg
        source={SCENE}
        alt="Soft rounded shapes in red, yellow, blue and green drifting slowly at the edges"
        isInteractive
      />
    )
  })
}
