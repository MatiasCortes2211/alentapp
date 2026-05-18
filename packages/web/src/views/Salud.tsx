import {
    Table,
    Button,
    Heading,
    HStack,
    IconButton,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuEye, LuPencil, LuTrash2 } from "react-icons/lu";
import { useEffect, useState } from "react";
import { membersService } from "../services/members";
import { medicalCertificateService } from "../services/medicalCertificate"; 
import type { MemberDTO, MedicalCertificateDTO, CreateMedicalCertificate, UpdateMedicalCertificate } from "@alentapp/shared";
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
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

const statusOptions = createListCollection({
  items: [
    { label: "Vigente", value: "true" },
    { label: "Inválido / Vencido", value: "false" },
  ],
});

export function SaludView() {
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Diccionario local para asociar a cada miembro con sus certificados reales en la grilla principal
    const [certificatesMap, setCertificatesMap] = useState<Record<string, MedicalCertificateDTO[]>>({});

    // 1. State para el modal de carga original (TDD-0007)
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);

    // 2. State para el modal de historial clínico (TDD-0007 / TDD-0009)
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [historyCertificates, setHistoryCertificates] = useState<MedicalCertificateDTO[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // 3. State para el modal de edición de un certificado (TDD-0008)
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCertId, setEditingCertId] = useState<string | null>(null);
    const [editFormData, setEditFormData] = useState<UpdateMedicalCertificate>({
        expiry_date: "",
        is_validated: true,
    });

    // Form state original de creación basado en tu TDD-0007
    const [formData, setFormData] = useState<CreateMedicalCertificate>({
        member_id: "",
        issue_date: "",
        expiry_date: "",
        doctor_license: "",
    });

    const loadAllData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const membersData = await membersService.getAll();
            setMembers(membersData);

            // Buscamos los certificados de cada socio en paralelo para poblar los botones de la grilla
            const maps: Record<string, MedicalCertificateDTO[]> = {};
            await Promise.all(
                membersData.map(async (m) => {
                    try {
                        const certs = await medicalCertificateService.getByMemberId(m.id);
                        maps[m.id] = certs;
                    } catch {
                        maps[m.id] = [];
                    }
                })
            );
            setCertificatesMap(maps);
        } catch (err: any) {
            setError(err.message || "Error al cargar los miembros");
        } finally {
            setIsLoading(false);
        }
    };

    const openCreateModal = (member: MemberDTO) => {
        setSelectedMember(member);
        setFormData({
            member_id: member.id,
            issue_date: new Date().toISOString().split('T')[0],
            expiry_date: "",
            doctor_license: ""
        });
        setIsDialogOpen(true);
    };

    const handleOpenHistory = async (member: MemberDTO) => {
        setSelectedMember(member);
        setIsHistoryOpen(true);
        setIsLoadingHistory(true);
        try {
            const data = await medicalCertificateService.getByMemberId(member.id);
            setHistoryCertificates(data);
        } catch (err: any) {
            alert(err.message || "Error al recuperar el historial del socio.");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const openEditModal = (cert: MedicalCertificateDTO) => {
        setEditingCertId(cert.id);
        setEditFormData({
            expiry_date: String(cert.expiry_date).split('T')[0],
            is_validated: cert.is_validated,
        });
        setIsEditOpen(true);
    };

    // Submit de Creación Original (TDD-0007)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await medicalCertificateService.create({
                member_id: formData.member_id,
                issue_date: new Date(formData.issue_date).toISOString(),
                expiry_date: new Date(formData.expiry_date).toISOString(),
                doctor_license: formData.doctor_license.trim()
            });

            setIsDialogOpen(false);
            alert("¡Certificado registrado con éxito!");
            loadAllData();
        } catch (err: any) {
            alert(err.message || "Error interno del servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Submit de Edición (TDD-0008)
    const handleUpdateStatus = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            if (editingCertId) {
                await medicalCertificateService.update(editingCertId, editFormData);
                setIsEditOpen(false);
                setIsHistoryOpen(false); // Cierra por si estaba abierto el historial
                loadAllData(); // Refresh global
            }
        } catch (err: any) {
            alert(err.message || "Error al actualizar la condición médica");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Manejador del Hard Delete en el Legajo (TDD-0009)
    const handleDeleteCertificate = async (certId: string, license: string) => {
        if (window.confirm(`¿Estás seguro de que deseas eliminar físicamente el certificado MN ${license}? Esta acción removerá el registro de la base de datos de forma segura.`)) {
            try {
                await medicalCertificateService.delete(certId);
                setIsHistoryOpen(false);
                loadAllData();
            } catch (err: any) {
                alert(err.message || "Error al eliminar el certificado");
            }
        }
    };

    useEffect(() => {
        loadAllData();
    }, []);

    return (
        <>
            {/* 1. Modal original de CREAR Certificado */}
            <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Cargar Certificado: {selectedMember?.name}</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Fecha de Emisión" required helperText="Debe ser la fecha que figura en el papel">
                                    <Input
                                        type="date"
                                        value={formData.issue_date}
                                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Fecha de Vencimiento" required>
                                    <Input
                                        type="date"
                                        value={formData.expiry_date}
                                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Matrícula del Médico" required>
                                    <Input
                                        placeholder="Ej. MN 123456"
                                        value={formData.doctor_license}
                                        onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                                        required
                                    />
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                Registrar Certificado
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            {/* 2. Modal de EDITAR Certificado */}
            <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
                <DialogContent>
                    <form onSubmit={handleUpdateStatus}>
                        <DialogHeader>
                            <DialogTitle>Modificar Condición Sanitaria</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                <Field label="Fecha de Vencimiento" required>
                                    <Input 
                                        type="date" 
                                        value={editFormData.expiry_date}
                                        onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
                                        required
                                    />
                                </Field>
                                <Field label="Estado de Validación" required>
                                    <SelectRoot 
                                        collection={statusOptions} 
                                        value={[String(editFormData.is_validated)]}
                                        onValueChange={(e) => setEditFormData({ ...editFormData, is_validated: e.value[0] === "true" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValueText placeholder="Seleccione el estado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.items.map((opt) => (
                                                <SelectItem item={opt} key={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectRoot>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            {/* 3. Modal de VER HISTORIAL CLINICO */}
            <DialogRoot open={isHistoryOpen} onOpenChange={(e) => setIsHistoryOpen(e.open)} size="lg">
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Historial de Certificados: {selectedMember?.name}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {isLoadingHistory ? (
                            <Center h="150px"><Spinner color="blue.500" /></Center>
                        ) : historyCertificates.length === 0 ? (
                            <Text color="fg.muted" textAlign="center" py="6">No registra certificados médicos cargados.</Text>
                        ) : (
                            <Table.Root size="sm" variant="line">
                                <Table.Header>
                                    <Table.Row bg="bg.muted/40">
                                        <Table.ColumnHeader>Emisión</Table.ColumnHeader>
                                        <Table.ColumnHeader>Vencimiento</Table.ColumnHeader>
                                        <Table.ColumnHeader>Matrícula</Table.ColumnHeader>
                                        <Table.ColumnHeader>Estado</Table.ColumnHeader>
                                        <Table.ColumnHeader textAlign="end">Acciones</Table.ColumnHeader>
                                    </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                    {historyCertificates.map((cert) => (
                                        <Table.Row key={cert.id}>
                                            <Table.Cell>{String(cert.issue_date).split('T')[0]}</Table.Cell>
                                            <Table.Cell>{String(cert.expiry_date).split('T')[0]}</Table.Cell>
                                            <Table.Cell>MN {cert.doctor_license}</Table.Cell>
                                            <Table.Cell>
                                                <Box display="inline-block" px="2" py="0.5" borderRadius="md" bg={cert.is_validated ? 'green.50' : 'red.50'} color={cert.is_validated ? 'green.700' : 'red.700'} fontSize="xs" fontWeight="bold">
                                                    {cert.is_validated ? 'Vigente' : 'Inválido'}
                                                </Box>
                                            </Table.Cell>
                                            <Table.Cell textAlign="end">
                                                <HStack gap="1" justify="flex-end">
                                                    <IconButton variant="ghost" size="xs" aria-label="Editar" onClick={() => openEditModal(cert)}>
                                                        <LuPencil />
                                                    </IconButton>
                                                    <IconButton variant="ghost" size="xs" colorPalette="red" aria-label="Eliminar Físico" onClick={() => handleDeleteCertificate(cert.id, cert.doctor_license)}>
                                                        <LuTrash2 />
                                                    </IconButton>
                                                </HStack>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cerrar Historial</Button>
                        </DialogActionTrigger>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

            {/* GRILLA GLOBAL DE SOCIOS */}
            <Stack gap="8">
                <Flex justify="space-between" align="center">
                    <Stack gap="1">
                        <Heading size="2xl" fontWeight="bold">Gestión de Salud</Heading>
                        <Text color="fg.muted" fontSize="md">
                            Administra los certificados médicos y aptitudes físicas de los socios.
                        </Text>
                    </Stack>
                    <Button variant="outline" onClick={loadAllData} disabled={isLoading}>
                        <LuRefreshCw /> Actualizar lista
                    </Button>
                </Flex>

                {error && (
                    <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
                        <Text fontWeight="bold">Error:</Text>
                        <Text>{error}</Text>
                    </Box>
                )}

                <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
                    {isLoading ? (
                        <Center h="300px"><Spinner size="xl" color="blue.500" /></Center>
                    ) : (
                        <Table.Root size="md" variant="line" interactive>
                            <Table.Header>
                                <Table.Row bg="bg.muted/50">
                                    <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4">DNI</Table.ColumnHeader>
                                    <Table.ColumnHeader py="4" textAlign="end">Acciones Sanitarias</Table.ColumnHeader>
                                </Table.Row>
                            </Table.Header>
                            <Table.Body>
                                {members.map((member) => {
                                    // 🚀 BUSQUEDA DEL VIGENTE: Filtramos los certificados del socio para encontrar el activo
                                    const misCerts = certificatesMap[member.id] || [];
                                    const certificadoVigente = misCerts.find(c => c.is_validated === true);

                                    return (
                                        <Table.Row key={member.id} _hover={{ bg: "bg.muted/30" }}>
                                            <Table.Cell fontWeight="semibold">{member.name}</Table.Cell>
                                            <Table.Cell color="fg.muted">{member.dni}</Table.Cell>
                                            <Table.Cell textAlign="end">
                                                <HStack gap="2" justify="flex-end">
                                                    {/* 👁️ Ver Historial Completo */}
                                                    <Button size="sm" variant="ghost" onClick={() => handleOpenHistory(member)}>
                                                        <LuEye /> Historial
                                                    </Button>

                                                    {/* 📝 ¡BOTÓN EDITAR EL VIGENTE AFUERA! Aparece solo si el socio tiene uno activo */}
                                                    {certificadoVigente && (
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            colorPalette="orange" 
                                                            onClick={() => openEditModal(certificadoVigente)}
                                                        >
                                                            <LuPencil /> Editar Vigente
                                                        </Button>
                                                    )}

                                                    {/* ➕ Cargar Certificado */}
                                                    <Button size="sm" colorPalette="blue" variant="ghost" onClick={() => openCreateModal(member)}>
                                                        <LuPlus /> Cargar Certificado
                                                    </Button>
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
        </>
    );
}