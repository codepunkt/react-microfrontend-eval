import React from 'react'
import FederatedWrapper from '../FederatedWrapper/FederatedWrapper'
import { ThemeProvider } from '@material-ui/core'
import { createMuiTheme } from '@material-ui/core/styles'
import { BrowserRouter, NavLink, Route, Switch } from 'react-router-dom'
import { NavigationConfig } from '../../types'
import styled from 'styled-components'

const MenuLink = styled(NavLink)`
  &.active {
    color: red;
  }
`

const theme = createMuiTheme({
  palette: {
    primary: {
      main: '#bada55',
    },
  },
})

const Frame: React.FC = ({ children }) => {
  const [routes, setRoutes] = React.useState<NavigationConfig['routes']>([])
  const [menuEntries, setMenuEntries] = React.useState<
    NavigationConfig['menuEntries']
  >([])

  React.useEffect(() => {
    const loadNavigationConfigurations = async () => {
      const results = await Promise.allSettled([
        import('remoteA/navigationConfig'),
        import('remoteB/navigationConfig'),
        import('remoteC/navigationConfig'),
      ])

      const menuEntries: NavigationConfig['menuEntries'] = []
      const routes: NavigationConfig['routes'] = []

      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          menuEntries.push(
            ...result.value.default.menuEntries.map((menuEntry) => ({
              ...menuEntry,
              path: `${result.value.default.pathPrefix}${menuEntry.path}`,
            }))
          )
          routes.push(
            ...result.value.default.routes.map((route) => ({
              ...route,
              path: `${result.value.default.pathPrefix}${route.path}`,
            }))
          )
        } else {
          console.error(result.reason)
        }
      })

      setRoutes(routes)
      setMenuEntries(menuEntries)
    }
    loadNavigationConfigurations()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <BrowserRouter>
        <ul>
          {menuEntries.map((menuEntry) => (
            <li key={menuEntry.path}>
              <MenuLink to={menuEntry.path}>{menuEntry.text}</MenuLink>
            </li>
          ))}
        </ul>
        <Switch>
          {routes.map((route) => (
            <Route exact key={route.path} path={route.path}>
              <FederatedWrapper
                error={`Could not load remote at path ${route.path}`}
                fallback={<div>Loading remote...</div>}
              >
                <route.component />
              </FederatedWrapper>
            </Route>
          ))}
          <Route>not found :(</Route>
        </Switch>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default Frame
