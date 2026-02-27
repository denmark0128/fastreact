import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'

import PageHeader from '../../components/shared/PageHeader'
import ImageDropInput from '../../components/shared/ImageDropInput'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import Modal from '../../components/ui/modal'
import { useAuth } from '../../context/AuthContext'
import { useNotification } from '../../context/NotificationContext'
import { useChangePassword, useMyProfile, useUpdateMyProfile } from './hooks'

const profileSchema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  profile_picture_url: z.string().optional(),
  contact_number: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: z.string().min(8, 'New password must be at least 8 characters'),
    confirm_password: z.string().min(1, 'Confirm your new password'),
  })
  .refine((values) => values.new_password === values.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type PasswordFormValues = z.infer<typeof passwordSchema>

function ProfilePage() {
  const { setUser } = useAuth()
  const { showNotification } = useNotification()
  const myProfileQuery = useMyProfile()
  const updateProfileMutation = useUpdateMyProfile()
  const changePasswordMutation = useChangePassword()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  const { control, handleSubmit, reset, watch } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      profile_picture_url: '',
      contact_number: '',
      street: '',
      city: '',
      region: '',
    },
  })

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  const fullNameValue = watch('full_name')
  const profilePictureUrl = watch('profile_picture_url')
  const contactNumberValue = watch('contact_number')
  const streetValue = watch('street')
  const cityValue = watch('city')
  const regionValue = watch('region')
  const profileInitial = (fullNameValue?.trim()?.[0] ?? 'U').toUpperCase()
  const fullAddress = [streetValue, cityValue, regionValue].filter(Boolean).join(', ')

  useEffect(() => {
    if (!myProfileQuery.data?.data) {
      return
    }

    const profile = myProfileQuery.data.data
    reset({
      full_name: profile.full_name,
      profile_picture_url: profile.profile_picture_url ?? '',
      contact_number: profile.contact_number ?? '',
      street: profile.street ?? '',
      city: profile.city ?? '',
      region: profile.region ?? '',
    })
    setUser(profile)
  }, [myProfileQuery.data, reset, setUser])

  const handleStartEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    const profile = myProfileQuery.data?.data
    if (profile) {
      reset({
        full_name: profile.full_name,
        profile_picture_url: profile.profile_picture_url ?? '',
        contact_number: profile.contact_number ?? '',
        street: profile.street ?? '',
        city: profile.city ?? '',
        region: profile.region ?? '',
      })
    }
    setIsEditing(false)
  }

  const onSubmit = (values: ProfileFormValues) => {
    updateProfileMutation.mutate(
      {
        full_name: values.full_name,
        profile_picture_url: values.profile_picture_url || undefined,
        contact_number: values.contact_number || undefined,
        street: values.street || undefined,
        city: values.city || undefined,
        region: values.region || undefined,
      },
      {
        onSuccess: (response) => {
          setUser(response.data)
          showNotification('Profile saved successfully')
          setIsEditing(false)
        },
      },
    )
  }

  const onPasswordSubmit = (values: PasswordFormValues) => {
    changePasswordMutation.mutate(
      {
        current_password: values.current_password,
        new_password: values.new_password,
      },
      {
        onSuccess: () => {
          resetPassword()
          showNotification('Password changed successfully')
        },
        onError: () => {
          showNotification('Unable to change password')
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title="My Profile"
        subtitle="Update your personal details and profile picture"
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="h-fit lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Profile Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center">
              {profilePictureUrl ? (
                <button type="button" className="rounded-full" onClick={() => setIsPreviewOpen(true)}>
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    className="h-24 w-24 rounded-full border border-slate-200 object-cover"
                  />
                </button>
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-xl font-semibold text-slate-700">
                  {profileInitial}
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Name</p>
                <p className="font-medium text-slate-900">{fullNameValue || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Email</p>
                <p className="font-medium text-slate-900">{myProfileQuery.data?.data?.email ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
                <p className="font-medium capitalize text-slate-900">{myProfileQuery.data?.data?.role?.replace('_', ' ') ?? '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Contact Number</p>
                <p className="font-medium text-slate-900">{contactNumberValue || '-'}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Address</p>
                <p className="font-medium text-slate-900">{fullAddress || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <CardTitle className="text-base">Edit Profile</CardTitle>
            {isEditing ? (
              <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={updateProfileMutation.isPending}>
                Cancel
              </Button>
            ) : (
              <Button size="sm" onClick={handleStartEdit}>
                Edit
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit(onSubmit)}>
              <Controller
                name="full_name"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label>Full Name</Label>
                    <Input {...field} disabled={!isEditing || updateProfileMutation.isPending} />
                    {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                  </div>
                )}
              />

              <Controller
                name="contact_number"
                control={control}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label>Contact Number</Label>
                    <Input {...field} disabled={!isEditing || updateProfileMutation.isPending} placeholder="e.g. +63 912 345 6789" />
                  </div>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Controller
                  name="street"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1 md:col-span-1">
                      <Label>Street</Label>
                      <Input {...field} disabled={!isEditing || updateProfileMutation.isPending} />
                    </div>
                  )}
                />
                <Controller
                  name="city"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1 md:col-span-1">
                      <Label>City</Label>
                      <Input {...field} disabled={!isEditing || updateProfileMutation.isPending} />
                    </div>
                  )}
                />
                <Controller
                  name="region"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1 md:col-span-1">
                      <Label>Region</Label>
                      <Input {...field} disabled={!isEditing || updateProfileMutation.isPending} />
                    </div>
                  )}
                />
              </div>

              <Controller
                name="profile_picture_url"
                control={control}
                render={({ field }) => (
                  <ImageDropInput
                    label="Profile Picture"
                    value={field.value ?? ''}
                    placeholder="https://example.com/profile.jpg"
                    disabled={!isEditing || updateProfileMutation.isPending}
                    allowRemove
                    removeLabel="Remove Picture"
                    onChange={field.onChange}
                  />
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={!isEditing || updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {profilePictureUrl ? (
        <Modal open={isPreviewOpen} title="Profile Picture" onClose={() => setIsPreviewOpen(false)}>
          <div className="flex justify-center">
            <img src={profilePictureUrl} alt="Profile preview" className="max-h-[70vh] w-full rounded-md object-contain" />
          </div>
        </Modal>
      ) : null}

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-4 md:grid-cols-3" onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
            <Controller
              name="current_password"
              control={passwordControl}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label>Current Password</Label>
                  <Input {...field} type="password" autoComplete="current-password" />
                  {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                </div>
              )}
            />
            <Controller
              name="new_password"
              control={passwordControl}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label>New Password</Label>
                  <Input {...field} type="password" autoComplete="new-password" />
                  {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                </div>
              )}
            />
            <Controller
              name="confirm_password"
              control={passwordControl}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label>Confirm Password</Label>
                  <Input {...field} type="password" autoComplete="new-password" />
                  {fieldState.error ? <p className="text-xs text-red-600">{fieldState.error.message}</p> : null}
                </div>
              )}
            />
            <div className="md:col-span-3 flex justify-end">
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending ? 'Updating...' : 'Change Password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  )
}

export default ProfilePage
