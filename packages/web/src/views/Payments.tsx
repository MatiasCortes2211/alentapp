import { 
  Button, 
  Heading, 
  HStack, 
  Stack, 
  Text, 
  Box,
  Flex,
  Input,
  Center,
  Table 
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import { membersService } from "../services/members";
import type { MemberDTO, CreatePaymentRequest } from "@alentapp/shared";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

export function PaymentsView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  
 
  const [payments, setPayments] = useState([]); 

  const [formData, setFormData] = useState({
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: "",
    member_id: "",
  });

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const data = await membersService.getAll();
        setMembers(data);
      } catch (err) {
        console.error("Error al cargar socios", err);
      }
    };
    fetchMembers();
  }, []);

  const openCreateModal = () => {
    setFormData({
      amount: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      due_date: "",
      member_id: members.length > 0 ? members[0].id : "", 
    });
    setError(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      const payload: CreatePaymentRequest = {
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
        due_date: formData.due_date,
        member_id: formData.member_id
      };

      await paymentsService.create(payload);
      setIsDialogOpen(false);
      alert("¡Pago generado con éxito!"); 
    } catch (err: any) {
      setError(err.message || "Error al generar el pago");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Genera nuevas obligaciones de pago para los socios.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" disabled={true}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Generar Pago
            </Button>
          </HStack>
        </Flex>

        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Generar Nuevo Pago</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                {error && (
                  <Box p="3" bg="red.50" color="red.700" borderRadius="md" fontSize="sm">
                    {error}
                  </Box>
                )}
                <Field label="Socio" required>
                  <Box 
                    as="select" 
                    value={formData.member_id} 
                    onChange={(e: any) => setFormData({ ...formData, member_id: e.target.value })} 
                    required
                    w="full"
                    h="10"
                    px="3"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor="border.muted"
                    bg="transparent"
                    outline="none"
                   bg="whiteAlpha.100"
                  color="gray"       
                  >
                    <option value="" disabled>Seleccione un socio</option>
                    {members.map(member => (
                      <option key={member.id} value={member.id}>
                        {member.name} (DNI: {member.dni})
                      </option>
                    ))}
                  </Box>
                </Field>
                <Flex gap="4">
                  <Field label="Monto ($)" required>
                    <Input type="number" min="1" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required />
                  </Field>
                </Flex>
                <Flex gap="4">
                  <Field label="Mes correspondido" required>
                    <Input type="number" min="1" max="12" value={formData.month} onChange={(e) => setFormData({ ...formData, month: Number(e.target.value) })} required />
                  </Field>
                  <Field label="Año" required>
                    <Input type="number" min="2024" value={formData.year} onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })} required />
                  </Field>
                </Flex>
                <Field label="Fecha de Vencimiento" required>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Generar
              </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" position="relative">
          {payments.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron pagos registrados.</Text>
                <Text fontSize="sm" color="gray.400">(La lista se implementará en la próxima actualización)</Text>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Período</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {/*endpoint getAll */}
              </Table.Body>
            </Table.Root>
          )}
        </Box>

      </Stack>
    </DialogRoot>
  );
}