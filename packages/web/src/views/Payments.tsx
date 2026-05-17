import { 
  Table, 
  Button, 
  Heading, 
  HStack,  
  Stack, 
  Text, 
  Box,
  Flex,
  Center,
  Input,
  IconButton,
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuTrash2 } from "react-icons/lu"; 
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import { membersService } from "../services/members";
import type { MemberDTO, CreatePaymentRequest, PaymentDTO } from "@alentapp/shared";
import { PaymentStatus } from "@alentapp/shared"; 
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
  
 
  const [payments, setPayments] = useState<PaymentDTO[]>([]); 

  const [formData, setFormData] = useState({
    amount: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: "",
    member_id: "",
  });

  useEffect(() => {
  const fetchData = async () => {
    try {
      const [membersData, paymentsData] = await Promise.all([
        membersService.getAll(),
        paymentsService.getAll(),
      ]);
      setMembers(membersData);
      setPayments(paymentsData);
    } catch (err) {
      console.error("Error al cargar datos", err);
    }
  };
    fetchData();
  }, []);

  const fetchPayments = async () => {
  try {
    const data = await paymentsService.getAll();
    setPayments(data);
  } catch (err: any) {
    setError(err.message || "Error al cargar los pagos");
  }
  };

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

  const handleRefresh = async () => {
     fetchPayments();
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
      fetchPayments();                       
      setIsDialogOpen(false);
      alert("¡Pago generado con éxito!"); 
    } catch (err: any) {
      setError(err.message || "Error al generar el pago");
    } finally {
      setIsSubmitting(false);
    }
  
  };

  const handleDeletePayment = async (id: string) => {
  if (window.confirm('¿Estás seguro de que deseas eliminar este pago? Esta acción no se puede deshacer.')) {
    try {
      await paymentsService.delete(id);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || "Error al eliminar el pago");
    }
  }
};
  
  const handleUpdatePayment = async (id: string, status: PaymentStatus.Paid | PaymentStatus.Canceled) => {
  try {
    await paymentsService.update(id, { status });
    fetchPayments();
  } catch (err: any) {
    alert(err.message || "Error al actualizar el pago");
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
            <Button variant="outline" onClick={handleRefresh}>
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
                  {payments.map((payment) => {
                    const member = members.find(m => m.id === payment.member_id);
                    return (
                      <Table.Row key={payment.id}>
                        <Table.Cell>{member ? `${member.name} (${member.dni})` : payment.member_id}</Table.Cell>
                        <Table.Cell color="fg.muted">${payment.amount.toLocaleString('es-AR')}</Table.Cell>
                        <Table.Cell color="fg.muted">{payment.month}/{payment.year}</Table.Cell>
                        <Table.Cell color="fg.muted">{payment.due_date}</Table.Cell>
                        <Table.Cell>
                        <Box 
                        display="inline-block" 
                        px="2" 
                        py="0.5" 
                        borderRadius="md" 
                        bg={
                          payment.status === 'PAID' ? 'green.50' :
                          payment.status === 'PENDING' ? 'orange.50' :
                          'red.50'
                        }
                        color={
                          payment.status === 'PAID' ? 'green.700' :
                          payment.status === 'PENDING' ? 'orange.700' :
                          'red.700'
                        }
                        fontSize="xs" 
                        fontWeight="bold" >
                        {payment.status} 
                      </Box>
                      </Table.Cell>

                        <Table.Cell textAlign="end">
                          <HStack gap="2" justify="flex-end">
                            {payment.status === 'PENDING' && (
                              <>
                                <Button
                                  size="sm"
                                  colorPalette="green"
                                  variant="outline"
                                  onClick={() => handleUpdatePayment(payment.id, PaymentStatus.Paid)}
                                >
                                  Pagar
                                </Button>
                                <Button
                                  size="sm"
                                  colorPalette="red"
                                  variant="outline"
                                  onClick={() => handleUpdatePayment(payment.id, PaymentStatus.Canceled)}
                                >
                                  Cancelar
                                </Button>
                              </>
                            )}
                            <IconButton
                              variant="ghost"
                              size="sm"
                              colorPalette="red"
                              aria-label="Eliminar pago"
                              onClick={() => handleDeletePayment(payment.id)}
                            >
                              <LuTrash2 />
                            </IconButton>                      
                        </HStack>
                    </Table.Cell>
                    </Table.Row>
                    );
                  })}
                </Table.Body>
            </Table.Root>
          )}
        </Box>

      </Stack>
    </DialogRoot>
  );
}