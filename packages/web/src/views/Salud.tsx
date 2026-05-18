import {
    Table,
    Button,
    Heading,
    HStack,
    Stack,
    Text,
    Box,
    Flex,
    Spinner,
    Center,
    Input,
    Badge
} from "@chakra-ui/react";
import { LuPlus, LuRefreshCw, LuEye, LuPencilLine } from "react-icons/lu";
import { useEffect, useState } from "react";
import { membersService } from "../services/members";
import { medicalCertificateService } from "../services/medicalCertificate";
import type { MemberDTO, CreateMedicalCertificate, MedicalCertificateDTO, UpdateMedicalCertificate } from "@alentapp/shared"; 
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

export function SaludView() {
    const [members, setMembers] = useState<MemberDTO[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modales
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false); 

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedMember, setSelectedMember] = useState<MemberDTO | null>(null);
    const [selectedCertificate, setSelectedCertificate] = useState<MedicalCertificateDTO | null>(null);

    const [historyCertificates, setHistoryCertificates] = useState<MedicalCertificateDTO[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Alta (TDD-0007)
    const [formData, setFormData] = useState<CreateMedicalCertificate>({
        member_id: "",
        issue_date: "",
        expiry_date: "",
        doctor_license: "",
    });

    // 🎯 FIEL AL TDD-0008: SOLO ESTOS DOS ATRIBUTOS EXISTEN ACÁ
    const [editFormData, setEditFormData] = useState<UpdateMedicalCertificate>({
        expiry_date: "",
        is_validated: true
    });

    const fetchMembers = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await membersService.getAll();
            setMembers(data);
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

    const openHistoryModal = async (member: MemberDTO) => {
        setSelectedMember(member);
        setIsHistoryOpen(true);
        setIsLoadingHistory(true);
        try {
            const certs = await medicalCertificateService.getByMemberId(member.id);
            setHistoryCertificates(certs);
        } catch (err: any) {
            alert(err.message || "Error al cargar el historial clínico");
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Abre el editor para CUALQUIER certificado (venga de la tabla principal o del historial)
    const openEditModal = (cert: MedicalCertificateDTO, member?: MemberDTO) => {
        if (member) setSelectedMember(member);
        setSelectedCertificate(cert);
        setEditFormData({
            expiry_date: cert.expiry_date.split('T')[0],
            is_validated: cert.is_validated
        });
        setIsEditOpen(true);
    };

    // Editar el actual/vigente directo de la tabla principal
    const handleQuickEdit = async (member: MemberDTO) => {
        try {
            const certs = await medicalCertificateService.getByMemberId(member.id);
            const activeCert = certs.find(c => c.is_validated === true);
            if (!activeCert) {
                alert("Este socio no tiene ningún certificado vigente activo. Buscalo en el historial o cargá uno nuevo.");
                return;
            }
            openEditModal(activeCert, member);
        } catch (err: any) {
            alert("Error al buscar el certificado activo");
        }
    };

    // PATCH RESTRICTO
    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedCertificate) return;
        setIsSubmitting(true);
        try {
            // Mandamos SOLO lo que tu diseño técnico acepta en el Request Body
            await medicalCertificateService.update(selectedCertificate.id, {
                expiry_date: editFormData.expiry_date ? new Date(editFormData.expiry_date).toISOString() : undefined,
                is_validated: editFormData.is_validated
            });

            alert("¡Certificado médico actualizado con éxito!");
            setIsEditOpen(false);

            if (isHistoryOpen && selectedMember) {
                const updatedCerts = await medicalCertificateService.getByMemberId(selectedMember.id);
                setHistoryCertificates(updatedCerts);
            }
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Error al actualizar el registro");
        } finally {
            setIsSubmitting(false);
        }
    };

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
            fetchMembers();
        } catch (err: any) {
            alert(err.message || "Error interno del servidor");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    return (
        <Stack gap="8">
            <Flex justify="space-between" align="center">
                <Stack gap="1">
                    <Heading size="2xl" fontWeight="bold">Gestión de Salud</Heading>
                    <Text color="fg.muted" fontSize="md">
                        Administra los certificados médicos y aptitudes físicas de los socios.
                    </Text>
                </Stack>
                <Button variant="outline" onClick={fetchMembers} disabled={isLoading}>
                    <LuRefreshCw /> Actualizar lista
                </Button>
            </Flex>

            {/* MODAL 1: Cargar Certificado (Alta) */}
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

            {/* MODAL 2: Historial de Certificados (READ con opción de Editar individual) */}
            <DialogRoot size="xl" open={isHistoryOpen} onOpenChange={(e) => setIsHistoryOpen(e.open)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Historial Médico: {selectedMember?.name}</DialogTitle>
                    </DialogHeader>
                    <DialogBody>
                        {isLoadingHistory ? (
                            <Center h="150px"><Spinner size="md" color="blue.500" /></Center>
                        ) : historyCertificates.length === 0 ? (
                            <Text textAlign="center" color="fg.muted" py="6">
                                El socio no posee ningún certificado cargado en el sistema.
                            </Text>
                        ) : (
                            <Table.Root size="sm" variant="line">
                                <Table.Header>
                                    <Table.Row bg="bg.muted/30">
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
                                            <Table.Cell>{cert.issue_date.split('T')[0]}</Table.Cell>
                                            <Table.Cell>{cert.expiry_date.split('T')[0]}</Table.Cell>
                                            <Table.Cell>{cert.doctor_license}</Table.Cell>
                                            <Table.Cell>
                                                <Badge colorPalette={cert.is_validated ? "green" : "red"}>
                                                    {cert.is_validated ? "Vigente" : "Invalido"}
                                                </Badge>
                                            </Table.Cell>
                                            <Table.Cell textAlign="end">
                                                <Button
                                                    size="xs"
                                                    colorPalette="gray"
                                                    variant="subtle"
                                                    onClick={() => openEditModal(cert)}
                                                >
                                                    <LuPencilLine /> Editar
                                                </Button>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))}
                                </Table.Body>
                            </Table.Root>
                        )}
                    </DialogBody>
                    <DialogFooter>
                        <DialogActionTrigger asChild>
                            <Button variant="outline">Cerrar</Button>
                        </DialogActionTrigger>
                    </DialogFooter>
                    <DialogCloseTrigger />
                </DialogContent>
            </DialogRoot>

            {/* 🚀 MODAL 3: EDITOR QUIRÚRGICO (SÓLO VENCIMIENTO Y ESTADO) */}
            <DialogRoot open={isEditOpen} onOpenChange={(e) => setIsEditOpen(e.open)}>
                <DialogContent>
                    <form onSubmit={handleUpdateSubmit}>
                        <DialogHeader>
                            <DialogTitle>Modificar Certificado Médico</DialogTitle>
                        </DialogHeader>
                        <DialogBody>
                            <Stack gap="4">
                                {/* 🛠️ SOLO FECHA DE VENCIMIENTO */}
                                <Field label="Nueva Fecha de Vencimiento" required helperText="Debe ser mayor a la fecha de emisión original.">
                                    <Input
                                        type="date"
                                        value={editFormData.expiry_date}
                                        onChange={(e) => setEditFormData({ ...editFormData, expiry_date: e.target.value })}
                                        required
                                    />
                                </Field>

                                {/* 🛠️ SOLO CONTROL DE ESTADO VALIDADO */}
                                <Field label="Estado del Certificado" helperText="Al dejarlo como Vigente pasará a ser la aptitud actual del socio.">
                                    <select
                                        value={editFormData.is_validated ? "true" : "false"}
                                        onChange={(e) => setEditFormData({ ...editFormData, is_validated: e.target.value === "true" })}
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            borderRadius: "6px",
                                            border: "1px solid #E2E8F0",
                                            background: "white"
                                        }}
                                    >
                                        <option value="true">Vigente / Validado</option>
                                        <option value="false">Invalido / Revocado</option>
                                    </select>
                                </Field>
                            </Stack>
                        </DialogBody>
                        <DialogFooter>
                            <DialogActionTrigger asChild>
                                <Button variant="outline">Cancelar</Button>
                            </DialogActionTrigger>
                            <Button type="submit" colorPalette="orange" loading={isSubmitting}>
                                Guardar Cambios
                            </Button>
                        </DialogFooter>
                        <DialogCloseTrigger />
                    </form>
                </DialogContent>
            </DialogRoot>

            {/* TABLA PRINCIPAL DE SOCIOS */}
            <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden">
                {isLoading ? (
                    <Center h="300px"><Spinner size="xl" color="blue.500" /></Center>
                ) : (
                    <Table.Root size="md" variant="line" interactive>
                        <Table.Header>
                            <Table.Row bg="bg.muted/50">
                                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                                <Table.ColumnHeader py="4">DNI</Table.ColumnHeader>
                                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                            </Table.Row>
                        </Table.Header>
                        <Table.Body>
                            {members.map((member) => (
                                <Table.Row key={member.id} _hover={{ bg: "bg.muted/30" }}>
                                    <Table.Cell fontWeight="semibold">{member.name}</Table.Cell>
                                    <Table.Cell color="fg.muted">{member.dni}</Table.Cell>
                                    <Table.Cell textAlign="end">
                                        <HStack gap="2" justify="flex-end">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="gray"
                                                onClick={() => openHistoryModal(member)}
                                            >
                                                <LuEye /> Ver Historial
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                colorPalette="orange"
                                                onClick={() => handleQuickEdit(member)}
                                            >
                                                <LuPencilLine /> Editar Actual
                                            </Button>
                                            <Button
                                                size="sm"
                                                colorPalette="blue"
                                                variant="ghost"
                                                onClick={() => openCreateModal(member)}
                                            >
                                                <LuPlus /> Cargar Certificado
                                            </Button>
                                        </HStack>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table.Root>
                )}
            </Box>
        </Stack>
    );
}

export default SaludView;