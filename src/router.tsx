import { createBrowserRouter, type RouteObject } from 'react-router'
import BookCheckoutRoute from './routes/BookCheckoutRoute'
import BookDetailRoute from './routes/BookDetailRoute'
import HomeRoute from './routes/HomeRoute'
import { ParentOnly, RequireAuth, Root, TabsLayout } from './routes/layouts'
import LoginRoute from './routes/LoginRoute'
import MyBooksRoute from './routes/MyBooksRoute'
import NotFoundRoute from './routes/NotFoundRoute'
import OrderHistoryRoute from './routes/OrderHistoryRoute'
import ReaderRoute from './routes/ReaderRoute'
import SettingsPinRoute from './routes/SettingsPinRoute'
import SettingsRoute from './routes/SettingsRoute'
import SubscriptionCheckoutRoute from './routes/SubscriptionCheckoutRoute'
import SubscriptionHistoryRoute from './routes/SubscriptionHistoryRoute'
import SubscriptionRoute from './routes/SubscriptionRoute'

const appRoutes: RouteObject[] = [
  { path: '/login', element: <LoginRoute /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <TabsLayout />,
        children: [
          { index: true, element: <HomeRoute /> },
          { path: 'my-books', element: <MyBooksRoute /> },
          { element: <ParentOnly />, children: [{ path: 'settings', element: <SettingsRoute /> }] },
        ],
      },
      { path: 'books/:id/read', element: <ReaderRoute /> },
      {
        element: <ParentOnly />,
        children: [
          { path: 'books/:id', element: <BookDetailRoute /> },
          { path: 'books/:id/checkout', element: <BookCheckoutRoute /> },
          { path: 'subscription', element: <SubscriptionRoute /> },
          { path: 'subscription/checkout', element: <SubscriptionCheckoutRoute /> },
          { path: 'settings/pin', element: <SettingsPinRoute /> },
          { path: 'settings/orders', element: <OrderHistoryRoute /> },
          { path: 'settings/subscriptions', element: <SubscriptionHistoryRoute /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundRoute /> },
]

export const routes: RouteObject[] = [{ element: <Root />, children: appRoutes }]

export const createAppRouter = () => createBrowserRouter(routes)
