import { Component, createResource, createSignal, For, Show } from 'solid-js';
import { PageHeader } from '../components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, Button, Input, TextArea, Modal, Toggle, Badge } from '../components/ui';
import { toast } from '../stores/toast';
import type { Persona } from '../../../shared/types';

export const Personas: Component = () => {
  const [personas, { refetch }] = createResource(() => window.api.personas.list());
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [editingPersona, setEditingPersona] = createSignal<Persona | null>(null);
  const [isSaving, setIsSaving] = createSignal(false);

  // Form state
  const [name, setName] = createSignal('');
  const [description, setDescription] = createSignal('');
  const [isActive, setIsActive] = createSignal(true);

  const resetForm = () => {
    setName('');
    setDescription('');
    setIsActive(true);
    setEditingPersona(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (persona: Persona) => {
    setEditingPersona(persona);
    setName(persona.name);
    setDescription(persona.description);
    setIsActive(persona.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!name().trim() || !description().trim()) return;

    setIsSaving(true);
    try {
      const editing = editingPersona();
      if (editing) {
        await window.api.personas.update(editing.id, {
          name: name(),
          description: description(),
          isActive: isActive()
        });
        toast.success('Persona updated');
      } else {
        await window.api.personas.create({
          name: name(),
          description: description(),
          isActive: isActive()
        });
        toast.success('Persona created');
      }
      await refetch();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save persona:', error);
      toast.error('Failed to save persona');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this persona?')) return;

    try {
      await window.api.personas.delete(id);
      await refetch();
      toast.success('Persona deleted');
    } catch (error) {
      console.error('Failed to delete persona:', error);
      toast.error('Failed to delete persona');
    }
  };

  const handleToggleActive = async (persona: Persona) => {
    try {
      await window.api.personas.update(persona.id, { isActive: !persona.isActive });
      await refetch();
    } catch (error) {
      console.error('Failed to toggle persona:', error);
      toast.error('Failed to update persona');
    }
  };

  return (
    <div>
      <PageHeader
        title="Personas"
        description="Define conversation partners for your practice sessions"
        actions={
          <Button onClick={openCreateModal}>
            Add Persona
          </Button>
        }
      />

      <Show
        when={personas() && personas()!.length > 0}
        fallback={
          <Card>
            <CardContent>
              <div class="text-center py-8">
                <p class="text-text-secondary mb-4">
                  No personas defined yet. Create your first conversation partner!
                </p>
                <Button onClick={openCreateModal}>Add Persona</Button>
              </div>
            </CardContent>
          </Card>
        }
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <For each={personas()}>
            {(persona) => (
              <Card>
                <CardHeader>
                  <div class="flex items-start justify-between">
                    <CardTitle>{persona.name}</CardTitle>
                    <Badge variant={persona.isActive ? 'success' : 'default'}>
                      {persona.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p class="text-text-secondary text-sm line-clamp-3">
                    {persona.description}
                  </p>
                </CardContent>
                <CardFooter>
                  <Toggle
                    checked={persona.isActive}
                    onChange={() => handleToggleActive(persona)}
                  />
                  <div class="flex-1" />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditModal(persona)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(persona.id)}
                    class="text-error hover:text-error"
                  >
                    Delete
                  </Button>
                </CardFooter>
              </Card>
            )}
          </For>
        </div>
      </Show>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen()}
        onClose={() => setIsModalOpen(false)}
        title={editingPersona() ? 'Edit Persona' : 'Create Persona'}
        size="md"
      >
        <div class="space-y-4">
          <Input
            label="Name"
            placeholder="e.g., Tanaka-san, Yuki, Sensei"
            value={name()}
            onInput={(e) => setName(e.currentTarget.value)}
          />
          <TextArea
            label="Description"
            placeholder="Describe the persona's personality, speaking style, and topics they like to discuss..."
            value={description()}
            onInput={(e) => setDescription(e.currentTarget.value)}
          />
          <Toggle
            checked={isActive()}
            onChange={setIsActive}
            label="Active (will be used in conversations)"
          />
          <div class="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!name().trim() || !description().trim()}
              loading={isSaving()}
            >
              {editingPersona() ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
