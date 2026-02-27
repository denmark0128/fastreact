import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import PageHeader from '../../components/shared/PageHeader'
import ImageDropInput from '../../components/shared/ImageDropInput'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import Modal from '../../components/ui/modal'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import type { CompanyProfileUpdatePayload } from '../../types'
import { useCompanyProfile, useUpdateCompanyProfile } from './hooks'

const companyProfileSchema = z.object({
  company_name: z.string().min(2, 'Company name is required'),
  email: z.string().optional(),
  contact_number: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  logo_url: z.string().optional(),
})

type CompanyProfileFormValues = z.infer<typeof companyProfileSchema>

function SettingsPage() {
  const { user } = useAuth()
  const { showNotification } = useNotification()
  const canManageSettings = user?.role === 'admin' || user?.role === 'hr_manager'
  const [isEditing, setIsEditing] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  const companyProfileQuery = useCompanyProfile()
  const updateCompanyProfileMutation = useUpdateCompanyProfile()

  const {
    control: companyControl,
    handleSubmit: handleCompanySubmit,
    reset: resetCompany,
    watch,
  } = useForm<CompanyProfileFormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      company_name: '',
      email: '',
      contact_number: '',
      street: '',
      city: '',
      region: '',
      logo_url: '',
    },
  })

  useEffect(() => {
    const companyProfile = companyProfileQuery.data?.data
    if (!companyProfile) {
      return
    }

    resetCompany({
      company_name: companyProfile.company_name,
      email: companyProfile.email ?? '',
      contact_number: companyProfile.contact_number ?? companyProfile.phone ?? '',
      street: companyProfile.street ?? companyProfile.address ?? '',
      city: companyProfile.city ?? '',
      region: companyProfile.region ?? '',
      logo_url: companyProfile.logo_url ?? '',
    })
  }, [companyProfileQuery.data, resetCompany])

  const companyNameValue = watch('company_name')
  const companyContactNumber = watch('contact_number')
  const companyStreet = watch('street')
  const companyCity = watch('city')
  const companyRegion = watch('region')
  const companyLogoUrl = watch('logo_url')
  const companyInitial = (companyNameValue?.trim()?.[0] ?? 'C').toUpperCase()
  const fullCompanyAddress = [companyStreet, companyCity, companyRegion].filter(Boolean).join(', ')

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    const companyProfile = companyProfileQuery.data?.data
    if (companyProfile) {
      resetCompany({
        company_name: companyProfile.company_name,
        email: companyProfile.email ?? '',
        contact_number: companyProfile.contact_number ?? companyProfile.phone ?? '',
        street: companyProfile.street ?? companyProfile.address ?? '',
        city: companyProfile.city ?? '',
        region: companyProfile.region ?? '',
        logo_url: companyProfile.logo_url ?? '',
      })
    }
    setIsEditing(false)
  }

  const onUpdateCompanyProfile = (values: CompanyProfileFormValues) => {
    const combinedAddress = [values.street, values.city, values.region].filter(Boolean).join(', ')
    const payload: CompanyProfileUpdatePayload = {
      company_name: values.company_name,
      email: values.email || undefined,
      contact_number: values.contact_number || undefined,
      street: values.street || undefined,
      city: values.city || undefined,
      region: values.region || undefined,
      phone: values.contact_number || undefined,
      address: combinedAddress || undefined,
      logo_url: values.logo_url || undefined,
    }

    updateCompanyProfileMutation.mutate(payload, {
      onSuccess: () => {
        showNotification('Company profile saved successfully')
        setIsEditing(false)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Company profile management"
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Company Summary</CardTitle>
            {canManageSettings ? (
              isEditing ? (
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updateCompanyProfileMutation.isPending}>
                  Cancel
                </Button>
              ) : (
                <Button size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              )
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {!canManageSettings ? (
              <Alert className="border-sky-200 bg-sky-50 text-sky-700">
                Read-only access: only Admin and HR Manager can update company profile.
              </Alert>
            ) : null}

            {companyProfileQuery.isLoading ? <p className="text-sm text-slate-500">Loading company profile...</p> : null}

            <div className="flex items-center justify-center">
              {companyLogoUrl ? (
                <button type="button" className="rounded-full" onClick={() => setIsPreviewOpen(true)}>
                  <img
                    src={companyLogoUrl}
                    alt="Company logo"
                    className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl font-semibold text-slate-700">
                  {companyInitial}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Company Name</p>
                <p className="font-medium text-slate-900">{companyNameValue || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{watch('email') || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                <p className="font-medium text-slate-900">{companyContactNumber || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{fullCompanyAddress || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Edit Company Profile</CardTitle>
            {canManageSettings ? (
              isEditing ? (
                <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updateCompanyProfileMutation.isPending}>
                  Cancel
                </Button>
              ) : (
                <Button size="sm" onClick={handleStartEdit}>
                  Edit
                </Button>
              )
            ) : null}
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4" onSubmit={handleCompanySubmit(onUpdateCompanyProfile)}>
              <Controller
                name="company_name"
                control={companyControl}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Company Name</Label>
                    <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />

              <Controller
                name="email"
                control={companyControl}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Email</Label>
                    <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                  </div>
                )}
              />

              <Controller
                name="contact_number"
                control={companyControl}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Contact Number</Label>
                    <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                  </div>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Controller
                  name="street"
                  control={companyControl}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Street</Label>
                      <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                    </div>
                  )}
                />
                <Controller
                  name="city"
                  control={companyControl}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>City</Label>
                      <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                    </div>
                  )}
                />
                <Controller
                  name="region"
                  control={companyControl}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Label>Region</Label>
                      <Input {...field} disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending} />
                    </div>
                  )}
                />
              </div>

              <Controller
                name="logo_url"
                control={companyControl}
                render={({ field }) => (
                  <ImageDropInput
                    label="Logo"
                    value={field.value ?? ''}
                    placeholder="https://example.com/logo.png"
                    disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending}
                    allowRemove
                    removeLabel="Remove Logo"
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={!canManageSettings || !isEditing || updateCompanyProfileMutation.isPending}>
                  {updateCompanyProfileMutation.isPending ? 'Saving...' : 'Save Company Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {companyLogoUrl ? (
        <Modal open={isPreviewOpen} title="Company Logo" onClose={() => setIsPreviewOpen(false)}>
          <div className="flex justify-center">
            <img src={companyLogoUrl} alt="Company logo preview" className="max-h-[70vh] w-full rounded-md object-contain" />
          </div>
        </Modal>
      ) : null}
    </>
  )
}

export default SettingsPage
