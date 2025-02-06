import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { CategoryPageContent } from "./category-page-content"



interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined }
}

const Page = async ({ searchParams }: PageProps) => {
  // Espera a que ambas promesas de params y searchParams se resuelvan
  const resolvedParams = await searchParams;
  const resolvedSearchParams = await searchParams;

  // Ahora puedes acceder a resolvedParams.name y resolvedSearchParams
  if (typeof resolvedParams.name !== "string") return notFound()

  const auth = await currentUser()

  if (!auth) {
    return notFound()
  }

  const user = await db.user.findUnique({
    where: { externalId: auth.id },
  })

  if (!user) return notFound()

  const category = await db.eventCategory.findUnique({
    where: {
      name_userId: {
        name: resolvedParams.name,  // Usamos resolvedParams.name ahora
        userId: user.id,
      },
    },
    include: {
      _count: {
        select: {
          events: true,
        },
      },
    },
  })

  if (!category) return notFound()

  const hasEvents = category._count.events > 0

  return (
    <DashboardPage title={`${category.emoji} ${category.name} events`}>
      <CategoryPageContent hasEvents={hasEvents} category={category} />
    </DashboardPage>
  )
}

export default Page
