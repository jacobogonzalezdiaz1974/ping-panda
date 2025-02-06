import { DashboardPage } from "@/components/dashboard-page";
import { db } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { CategoryPageContent } from "./category-page-content";

// El tipo de PageProps ahora no necesita ser una promesa
interface PageProps {
  params: {
    name: string | string[] | undefined;
  };
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

const Page = async ({ params, searchParams }: PageProps) => {
  // Validación directa del parámetro `name`
  if (typeof params.name !== "string") return notFound();

  const auth = await currentUser();

  if (!auth) {
    return notFound();
  }

  const user = await db.user.findUnique({
    where: { externalId: auth.id },
  });

  if (!user) return notFound();

  const category = await db.eventCategory.findUnique({
    where: {
      name_userId: {
        name: params.name, // Usamos params.name directamente
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
  });

  if (!category) return notFound();

  const hasEvents = category._count.events > 0;

  return (
    <DashboardPage title={`${category.emoji} ${category.name} events`}>
      <CategoryPageContent hasEvents={hasEvents} category={category} />
    </DashboardPage>
  );
}

export default Page;
