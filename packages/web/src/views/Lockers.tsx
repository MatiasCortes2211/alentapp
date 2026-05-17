import { 
  Table, Button, Heading, HStack, IconButton, Stack, Text, Box, Flex, Spinner, Center, Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { lockersService } from "../services/lockers";
import { membersService } from "../services/members";
import type { LockerDTO, CreateLockerRequest, UpdateLockerRequest, LockerLocation, LockerStatus, MemberDTO } from "@alentapp/shared";
import { 
  DialogRoot, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogActionTrigger, DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";
import { 
  SelectRoot, SelectTrigger, SelectValueText, SelectContent, SelectItem, createListCollection 
} from "../components/ui/select";

const locationOptions = createListCollection({
  items: [
    { label: "Vestuario Masculino", value: "Male" },
    { label: "Vestuario Femenino", value: "Female" },
    { label: "Niños", value: "Kids" },
  ],
});

const statusOptions = createListCollection({
  items: [
    { label: "Disponible", value: "Available" },
    { label: "Ocupado", value: "Occupied" },
    { label: "Mantenimiento", value: "Maintenance" },
  ],
});

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberDTO[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateLockerRequest>>({
    number: undefined,
    location: "Male",
    status: "Available",
    end_contract_date: "",
    member_id: "",
  });

  const fetchLockers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lockersService.getAll();
      setLockers(data);
    } catch (err: any) {
      setError(err.message || "Error al cargar los casilleros");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingLockerId(null);
    setFormData({ number: undefined, location: "Male", status: "Available", end_contract_date: "", member_id: "" });
    setIsDialogOpen(true);
  };

  const openEditModal = (locker: LockerDTO) => {
    setEditingLockerId(locker.id);
    setFormData({
      number: locker.number,
      location: locker.location,
      status: locker.status,
      end_contract_date: locker.end_contract_date ? locker.end_contract_date.split('T')[0] : "",
      member_id: locker.member_id || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        end_contract_date: formData.end_contract_date ? new Date(formData.end_contract_date).toISOString() : null,
        member_id: formData.member_id || null
      };

      if (editingLockerId) {
        await lockersService.update(editingLockerId, payload as UpdateLockerRequest);
      } else {
        await lockersService.create(payload as CreateLockerRequest);
      }
      setIsDialogOpen(false);
      fetchLockers();
    } catch (err: any) {
      alert(err.message || "Error al guardar el casillero");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocker = async (id: string, number: number) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el casillero #${number}?`)) {
      try {
        await lockersService.delete(id);
        fetchLockers();
      } catch (err: any) {
        alert(err.message || "Error al eliminar el casillero");
      }
    }
  };

  useEffect(() => {
    fetchLockers();
    (async () => {
      try {
        const membersData = await membersService.getAll();
        setMembers(membersData);
      } catch (err) {
        console.error("Error al cargar miembros", err);
      }
    })();
  }, []);

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Casilleros</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona el inventario de lockers y sus asignaciones a socios.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Casillero
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLockerId ? "Editar Casillero" : "Agregar Nuevo Casillero"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número de Casillero" required>
                  <Input 
                    type="number"
                    placeholder="Ej. 101" 
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Ubicación" required>
                  <SelectRoot 
                    collection={locationOptions} 
                    value={[formData.location as string]}
                    onValueChange={(e) => setFormData({ ...formData, location: e.value[0] as LockerLocation })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione una ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      {locationOptions.items.map((loc) => (
                        <SelectItem item={loc} key={loc.value}>
                          {loc.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Estado" required>
                  <SelectRoot 
                    collection={statusOptions} 
                    value={[formData.status as string]}
                    onValueChange={(e) => setFormData({ ...formData, status: e.value[0] as LockerStatus })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Seleccione el estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.items.map((stat) => (
                        <SelectItem item={stat} key={stat.value}>
                          {stat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>
                <Field label="Socio Asignado (Opcional)">
                  <Box 
                    as="select" 
                    value={formData.member_id || ""} 
                    onChange={(e: any) => setFormData({ ...formData, member_id: e.target.value })} 
                    w="full"
                    h="10"
                    px="3"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.muted"
                    bg="transparent"
                    outline="none"
                  >
                    <option value="">Sin asignar</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} (DNI: {member.dni})
                      </option>
                    ))}
                  </Box>
                </Field>
                <Field label="Fecha Fin de Contrato (Opcional)">
                  <Input 
                    type="date" 
                    value={formData.end_contract_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_contract_date: e.target.value })}
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingLockerId ? "Guardar Cambios" : "Crear Casillero"}
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

      {error && (
        <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold">Error:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px">
        {isLoading ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Spinner size="xl" color="blue.500" />
              <Text color="fg.muted">Cargando casilleros...</Text>
            </Stack>
          </Center>
        ) : lockers.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron casilleros activos.</Text>
              <Button variant="ghost" onClick={fetchLockers}>Reintentar</Button>
            </Stack>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Fin Contrato</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Socio Asignado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {lockers.map((locker) => (
                <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                  <Table.Cell fontWeight="semibold" color="fg.emphasized">#{locker.number}</Table.Cell>
                  <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                  <Table.Cell>
                    <Box 
                      display="inline-block" px="2" py="0.5" borderRadius="md" fontSize="xs" fontWeight="bold"
                      bg={locker.status === 'Available' ? 'green.50' : locker.status === 'Occupied' ? 'red.50' : 'orange.50'} 
                      color={locker.status === 'Available' ? 'green.700' : locker.status === 'Occupied' ? 'red.700' : 'orange.700'} 
                    >
                      {locker.status}
                    </Box>
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {locker.end_contract_date ? new Date(locker.end_contract_date).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '-'}
                  </Table.Cell>
                  <Table.Cell color="fg.muted">
                    {(() => {
                      if (!locker.member_id) return '-';
                      const member = members.find(m => m.id === locker.member_id);
                      return member ? `${member.name} (${member.dni})` : 'Socio desconocido';
                    })()}
                  </Table.Cell>
                  <Table.Cell textAlign="end">
                    <HStack gap="2" justify="flex-end">
                      <IconButton variant="ghost" size="sm" onClick={() => openEditModal(locker)}>
                        <LuPencil />
                      </IconButton>
                      <IconButton variant="ghost" size="sm" colorPalette="red" onClick={() => handleDeleteLocker(locker.id, locker.number)}>
                        <LuTrash2 />
                      </IconButton>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </Stack>
  </DialogRoot>
);
}