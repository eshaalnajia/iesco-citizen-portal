import { useState }                from "react"
import { useSubmitServiceRequest } from "@/hooks/useServiceRequest"
import { NewConnectionForm }       from "@/components/modules/requests/NewConnectionForm"
import { MeterChangeForm }         from "@/components/modules/requests/MeterChangeForm"
import { EnergyAuditForm }         from "@/components/modules/requests/EnergyAuditForm"
import { SafetyInspectionForm }    from "@/components/modules/requests/SafetyInspectionForm"
import { RequestTracker }          from "@/components/modules/requests/RequestTracker"
import { Button }                  from "@/components/ui/button"
import { Tabs, TabsList,
         TabsTrigger, TabsContent} from "@/components/ui/tabs"
import { CheckCircle, Loader2,
         Zap, Gauge, Leaf,
         ShieldAlert, Search }     from "lucide-react"

const FORM_TYPES = [
  { value: "new_connection",    label: "New Connection", icon: Zap         },
  { value: "meter_change",      label: "Meter Change",   icon: Gauge       },
  { value: "energy_audit",      label: "Energy Audit",   icon: Leaf        },
  { value: "safety_inspection", label: "Safety Issue",   icon: ShieldAlert },
]

const FORM_COMPONENTS = {
  new_connection:    NewConnectionForm,
  meter_change:      MeterChangeForm,
  energy_audit:      EnergyAuditForm,
  safety_inspection: SafetyInspectionForm,
}

function buildDetails(type, values) {
  switch (type) {
    case "new_connection":
      return {
        property_type:    values.property_type,
        load_required_kw: parseFloat(values.load_required_kw) || 0,
        plot_number:      values.plot_number,
        document_type:    values.document_type,
      }
    case "meter_change":
      return {
        meter_number:    values.meter_number,
        issue_type:      values.issue_type,
        current_reading: parseInt(values.current_reading) || null,
      }
    case "energy_audit":
      return {
        avg_monthly_bill:   parseFloat(values.avg_monthly_bill) || 0,
        property_size_sqft: parseInt(values.property_size_sqft) || null,
        major_appliances:   values.major_appliances_text
          ? values.major_appliances_text.split(",").map((s) => s.trim())
          : [],
        concern: values.concern,
      }
    case "safety_inspection":
      return {
        hazard_type:  values.hazard_type,
        urgency:      values.urgency,
        description:  values.description,
      }
    default:
      return {}
  }
}

export default function SelfServicePage() {
  const [formType, setFormType]   = useState("new_connection")
  const [values, setValues]       = useState({})
  const [submitted, setSubmitted] = useState(null)
  const [errors, setErrors]       = useState({})

  const { mutate, isPending } = useSubmitServiceRequest()

  const FormComponent = FORM_COMPONENTS[formType]

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function handleTypeChange(type) {
    setFormType(type)
    setValues({})
    setErrors({})
    setSubmitted(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    mutate(
      {
        request_type:     formType,
        full_name:        values.full_name,
        cnic:             values.cnic,
        phone:            values.phone,
        email:            values.email,
        address:          values.address,
        sector:           values.sector,
        reference_number: values.reference_number,
        details:          buildDetails(formType, values),
      },
      {
        onSuccess: (data) => {
          setSubmitted(data)
          setValues({})
        },
        onError: (err) => {
          const detail = err.response?.data?.detail
          if (Array.isArray(detail)) {
            const fieldErrors = {}
            detail.forEach((e) => {
              const field = e.loc?.[e.loc.length - 1]
              if (field) fieldErrors[field] = e.msg
            })
            setErrors(fieldErrors)
          }
        },
      }
    )
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Self-Service Requests</h1>
        <p className="text-slate-500 mt-1 text-sm">
          Submit IESCO service requests online - no office visit needed
        </p>
      </div>

      <Tabs defaultValue="submit">
        <TabsList>
          <TabsTrigger value="submit">Submit a request</TabsTrigger>
          <TabsTrigger value="track" className="flex items-center gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Track my request
          </TabsTrigger>
        </TabsList>

        <TabsContent value="submit" className="space-y-5 mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FORM_TYPES.map((type) => {
              const Icon     = type.icon
              const selected = formType === type.value
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleTypeChange(type.value)}
                  className={`flex flex-col items-center gap-1.5 p-3
                              rounded-xl border-2 text-center transition
                              ${selected
                                ? "border-iesco-teal bg-iesco-teal/5"
                                : "border-slate-200 bg-white hover:border-slate-300"
                              }`}
                >
                  <Icon className={`h-5 w-5 ${selected ? "text-iesco-teal" : "text-slate-400"}`} />
                  <span className={`text-xs font-medium
                                   ${selected ? "text-iesco-teal" : "text-slate-700"}`}>
                    {type.label}
                  </span>
                </button>
              )
            })}
          </div>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 space-y-4 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              <div>
                <p className="font-bold text-lg text-slate-900">Request submitted</p>
                <p className="text-slate-500 text-sm mt-1">{submitted.message}</p>
              </div>
              <div className="bg-white rounded-xl p-4 space-y-2">
                <p className="text-xs text-slate-400">Your ticket number</p>
                <p className="font-mono text-2xl font-bold text-iesco-teal">
                  {submitted.ticket_number}
                </p>
                <p className="text-xs text-slate-500">
                  Estimated time: {submitted.estimated_time}
                </p>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSubmitted(null)}
              >
                Submit another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormComponent
                values={values}
                onChange={handleChange}
                errors={errors}
              />
              <Button
                type="submit"
                className="w-full"
                disabled={isPending}
              >
                {isPending
                  ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</>
                  : "Submit request"
                }
              </Button>
            </form>
          )}
        </TabsContent>

        <TabsContent value="track" className="mt-4">
          <div className="space-y-2 mb-4">
            <p className="text-sm text-slate-600">
              Enter the ticket number from your submission confirmation to check
              the current status of your request.
            </p>
          </div>
          <RequestTracker />
        </TabsContent>
      </Tabs>
    </div>
  )
}
