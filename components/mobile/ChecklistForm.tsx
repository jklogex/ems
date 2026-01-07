'use client';

import { useState, useEffect } from 'react';

interface ChecklistItem {
  id: string;
  item_text: string;
  item_type: string;
  completed: boolean;
  value: string;
  order_index: number;
}

interface ChecklistFormProps {
  workOrderId: string;
  items: ChecklistItem[];
  onUpdate?: () => void;
}

export default function ChecklistForm({ workOrderId, items, onUpdate }: ChecklistFormProps) {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(items);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setChecklistItems(items);
  }, [items]);

  const handleToggle = async (itemId: string, completed: boolean) => {
    const updated = checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed } : item
    );
    setChecklistItems(updated);

    try {
      setSaving(true);
      await fetch(`/api/work-orders/${workOrderId}/items`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          completed,
        }),
      });

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating checklist item:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleValueChange = async (itemId: string, value: string) => {
    const updated = checklistItems.map((item) =>
      item.id === itemId ? { ...item, value } : item
    );
    setChecklistItems(updated);

    try {
      await fetch(`/api/work-orders/${workOrderId}/items`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
          value,
        }),
      });
    } catch (error) {
      console.error('Error updating checklist value:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Checklist de Inspección</h3>
      {checklistItems.length === 0 ? (
        <p className="text-gray-500 text-sm">No hay items en el checklist</p>
      ) : (
        <div className="space-y-3">
          {checklistItems
            .sort((a, b) => a.order_index - b.order_index)
            .map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-white rounded border">
                <input
                  type="checkbox"
                  checked={item.completed}
                  onChange={(e) => handleToggle(item.id, e.target.checked)}
                  disabled={saving}
                  className="mt-1 w-5 h-5"
                />
                <div className="flex-1">
                  <label className="text-sm font-medium">{item.item_text}</label>
                  {item.item_type === 'text' && (
                    <input
                      type="text"
                      value={item.value || ''}
                      onChange={(e) => handleValueChange(item.id, e.target.value)}
                      placeholder="Ingrese valor..."
                      className="mt-2 w-full px-3 py-2 border rounded text-sm"
                    />
                  )}
                  {item.item_type === 'number' && (
                    <input
                      type="number"
                      value={item.value || ''}
                      onChange={(e) => handleValueChange(item.id, e.target.value)}
                      placeholder="Ingrese número..."
                      className="mt-2 w-full px-3 py-2 border rounded text-sm"
                    />
                  )}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

