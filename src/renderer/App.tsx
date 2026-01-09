/**
 * App Entry Point
 * Sets up the router provider
 */

import { RouterProvider } from 'react-router-dom'
import { router } from './router'

function App() {
  return <RouterProvider router={router} />
}

export default App
