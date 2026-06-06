import { prisma } from "@/lib/prisma";
import SubscriptionsTypesClient from "./SubscriptionsTypesClient";

export default async function SubscriptionsTypesPage() {
  const [membershipTypes, memberships] = await Promise.all([
    prisma.membershipType.findMany({ orderBy: { name: "asc" } }),
    prisma.membership.findMany({
      where: { isActive: true },
      include: { membershipType: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <SubscriptionsTypesClient
      membershipTypes={membershipTypes}
      memberships={memberships.map((m) => ({
        id: m.id, name: m.name, type: m.type, price: m.price,
        description: m.description ?? null,
        daysValid: m.daysValid ?? null,
        visitCount: m.visitCount ?? null,
        typeName: m.membershipType?.name ?? null,
      }))}
    />
  );
}
