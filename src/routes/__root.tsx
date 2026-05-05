import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { I18nextProvider } from 'react-i18next'
import { AppHeader } from '@/components/shared/AppHeader'
import { FileProvider } from '@/shared/contexts/files-context'
import i18n from '#/i18n'

import '../main.css'
import { ValidationProvider } from 'shared/contexts/validation-context'

const queryClient = new QueryClient()

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'VéXe.vn - Đặt vé xe khách trực tuyến' },
      {
        name: 'description',
        content: 'Đặt vé xe khách online nhanh chóng, tiện lợi trên VéXe.vn',
      },
    ],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <ValidationProvider>
          <FileProvider>
            <div className="min-h-screen bg-background text-foreground">
              <AppHeader />
              <RootOutlet />
              <TanStackDevtools
                config={{ position: 'bottom-right' }}
                plugins={[
                  {
                    name: 'Tanstack Router',
                    render: <TanStackRouterDevtoolsPanel />,
                  },
                ]}
              />
            </div>
          </FileProvider>
        </ValidationProvider>
      </I18nextProvider>
    </QueryClientProvider>
  )
}

import { Outlet as RootOutlet } from '@tanstack/react-router'

function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="text-2xl font-semibold">Trang không tìm thấy</h1>
      <p className="text-muted-foreground">
        Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
      </p>
      <Link
        to="/"
        className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Về trang chủ
      </Link>
    </div>
  )
}
