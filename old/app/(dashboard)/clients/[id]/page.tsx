import { prisma } from "@/lib/prisma";
import { mapUserToClient } from "@/lib/client-mapper";
import { notFound } from "next/navigation";
import ClientDetailClient from "@/components/clients/ClientDetailClient";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await prisma.user.findUnique({ where: { id: Number(id) } });
  if (!user) notFound();

  const [memberships, comments, visits] = await Promise.all([
    prisma.clientMembership.findMany({
      where: { clientId: user.id },
      include: { membership: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.comment.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.clientVisit.findMany({
      where: { clientId: user.id },
      orderBy: { checkInTime: "desc" },
      take: 20,
    }),
  ]);

  return (
    <ClientDetailClient
      client={mapUserToClient(user)}
      memberships={memberships.map((m) => ({
        id: m.id,
        membershipName: m.membership.name,
        status: m.status,
        activationDate: m.activationDate?.toISOString() ?? null,
        expirationDate: m.expirationDate?.toISOString() ?? null,
        remainingVisits: m.remainingVisits ?? null,
        frozenAt: m.frozenAt?.toISOString() ?? null,
        freezeReason: m.freezeReason ?? null,
      }))}
      comments={comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt.toISOString(),
        managerId: c.managerId ?? null,
      }))}
      visits={visits.map((v) => ({
        id: v.id,
        checkInTime: v.checkInTime.toISOString(),
        checkOutTime: v.checkOutTime?.toISOString() ?? null,
        membershipType: v.membershipType ?? null,
      }))}
    />
  );
}
