import { prisma } from "@/lib/prisma";
import { mapUserToClient } from "@/lib/client-mapper";
import ClientsPageClient from "@/components/clients/ClientsPageClient";

export default async function ClientsPage() {
  const [users, memberships] = await Promise.all([
    prisma.user.findMany({
      where: { role: "клиент" },
      orderBy: { id: "desc" },
    }),
    prisma.clientMembership.findMany({
      include: { membership: { select: { name: true } } },
    }),
  ]);

  const membershipMap: Record<number, { name: string; status: string; expirationDate: string | null }> = {};
  for (const cm of memberships) {
    if (!membershipMap[cm.clientId]) {
      membershipMap[cm.clientId] = {
        name: cm.membership.name,
        status: cm.status,
        expirationDate: cm.expirationDate?.toISOString() ?? null,
      };
    }
  }

  return (
    <ClientsPageClient
      initialClients={users.map(mapUserToClient)}
      membershipMap={membershipMap}
      totalInDB={users.length}
    />
  );
}
