"use strict";
"use client";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SignUpPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const link_1 = __importDefault(require("next/link"));
const button_1 = require("@/components/ui/button");
const card_1 = require("@/components/ui/card");
const input_1 = require("@/components/ui/input");
const label_1 = require("@/components/ui/label");
const alert_1 = require("@/components/ui/alert");
const lucide_react_1 = require("lucide-react");
const AuthRedirect_1 = require("@/components/AuthRedirect");
const AuthContext_1 = require("@/contexts/AuthContext");
function SignUpPage() {
    const router = (0, navigation_1.useRouter)();
    const { login } = (0, AuthContext_1.useAuth)();
    const [formData, setFormData] = (0, react_1.useState)({
        name: "",
        email: "",
        customerId: "",
        password: "",
        confirmPassword: "",
        profileImage: "",
    });
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)("");
    const [success, setSuccess] = (0, react_1.useState)("");
    const [imageUploading, setImageUploading] = (0, react_1.useState)(false);
    const [fieldErrors, setFieldErrors] = (0, react_1.useState)({});
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => (Object.assign(Object.assign({}, prev), { [name]: value })));
        setError("");
        setSuccess("");
        setFieldErrors(prev => (Object.assign(Object.assign({}, prev), { [name]: undefined }))); // Clear specific field error on input change
    };
    const validateForm = () => {
        const errors = {};
        let valid = true;
        if (!formData.name.trim()) {
            errors.name = "Name is required";
            valid = false;
        }
        if (!formData.email.trim()) {
            errors.email = "Email is required";
            valid = false;
        }
        else if (!/^\S+@\S+\.\S+$/.test(formData.email.trim())) {
            errors.email = "Please enter a valid email address";
            valid = false;
        }
        if (!formData.customerId.trim()) {
            errors.customerId = "Customer ID is required";
            valid = false;
        }
        else if (!/^\d{10}$/.test(formData.customerId.trim())) {
            errors.customerId = "Customer ID must be exactly 10 digits";
            valid = false;
        }
        if (!formData.password.trim()) {
            errors.password = "Password is required";
            valid = false;
        }
        else if (formData.password.length < 8) {
            errors.password = "Password must be at least 8 characters, including a number and a symbol.";
            valid = false;
        }
        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = "Passwords do not match";
            valid = false;
        }
        setFieldErrors(errors);
        if (!valid)
            setError("Please correct the highlighted fields below.");
        return valid;
    };
    const handleImageChange = (e) => __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const file = (_a = e.target.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        setImageUploading(true);
        try {
            const formDataImg = new FormData();
            formDataImg.append("file", file);
            formDataImg.append("upload_preset", "secureAuth");
            const res = yield fetch("https://api.cloudinary.com/v1_1/dtebmtl6w/image/upload", {
                method: "POST",
                body: formDataImg,
            });
            const data = yield res.json();
            if (!res.ok)
                throw new Error(((_b = data.error) === null || _b === void 0 ? void 0 : _b.message) || "Upload failed");
            setFormData(prev => (Object.assign(Object.assign({}, prev), { profileImage: data.secure_url })));
        }
        catch (err) {
            setError("Image upload failed. Please try again.");
        }
        finally {
            setImageUploading(false);
        }
    });
    const handleSubmit = (e) => __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        if (!validateForm())
            return;
        setIsLoading(true);
        setError("");
        setSuccess("");
        try {
            const res = yield fetch("/api/auth/signup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    customerId: formData.customerId,
                    password: formData.password,
                    profileImage: formData.profileImage,
                }),
            });
            const data = yield res.json();
            if (!res.ok)
                throw new Error(data.message || "Signup failed");
            // After successful signup, automatically log in
            setSuccess("Registration successful! Logging you in...");
            yield login(formData.customerId, formData.password);
            router.push("/dashboard");
        }
        catch (err) {
            setError(err.message);
        }
        finally {
            setIsLoading(false);
        }
    });
    return (<AuthRedirect_1.AuthRedirect>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <link_1.default href="/login" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <lucide_react_1.ArrowLeft className="h-4 w-4 mr-2"/>
              Back to Login
            </link_1.default>
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <lucide_react_1.Building2 className="h-6 w-6 text-white"/>
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-blue-600">CANARA BANK</h1>
              <p className="text-sm text-yellow-600 font-semibold">Together We Can</p>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign Up</h2>
          <p className="text-gray-600">Create your Net Banking account</p>
        </div>
        <card_1.Card className="shadow-xl border-0">
          <card_1.CardHeader className="pb-6">
            <card_1.CardTitle className="flex items-center space-x-2 text-lg">
              <lucide_react_1.Shield className="h-5 w-5 text-blue-600"/>
              <span>Secure Registration</span>
            </card_1.CardTitle>
          </card_1.CardHeader>
          <card_1.CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label_1.Label htmlFor="name">Name</label_1.Label>
                <div className="relative">
                  <lucide_react_1.User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input_1.Input id="name" name="name" type="text" placeholder="Your Name" value={formData.name} onChange={handleInputChange} className={`pl-10 ${fieldErrors.name ? 'border-red-500 ring-red-200' : ''}`} disabled={isLoading}/>
                </div>
                {fieldErrors.name && <p className="text-xs text-red-600 mt-1">{fieldErrors.name}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="email">Email</label_1.Label>
                <div className="relative">
                  <lucide_react_1.Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input_1.Input id="email" name="email" type="email" placeholder="you@email.com" value={formData.email} onChange={handleInputChange} className={`pl-10 ${fieldErrors.email ? 'border-red-500 ring-red-200' : ''}`} disabled={isLoading}/>
                </div>
                {fieldErrors.email && <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="customerId">Customer ID</label_1.Label>
                <div className="relative">
                  <lucide_react_1.User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input_1.Input id="customerId" name="customerId" type="text" placeholder="Choose a Customer ID" value={formData.customerId} onChange={handleInputChange} className={`pl-10 ${fieldErrors.customerId ? 'border-red-500 ring-red-200' : ''}`} disabled={isLoading}/>
                </div>
                {fieldErrors.customerId && <p className="text-xs text-red-600 mt-1">{fieldErrors.customerId}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="password">Password</label_1.Label>
                <div className="relative">
                  <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input_1.Input id="password" name="password" type="password" placeholder="Create a password" value={formData.password} onChange={handleInputChange} className={`pl-10 ${fieldErrors.password ? 'border-red-500 ring-red-200' : ''}`} disabled={isLoading}/>
                </div>
                {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
                <p className="text-xs text-gray-500 mt-1">Password must be at least 8 characters, including a number and a symbol.</p>
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="confirmPassword">Confirm Password</label_1.Label>
                <div className="relative">
                  <lucide_react_1.Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400"/>
                  <input_1.Input id="confirmPassword" name="confirmPassword" type="password" placeholder="Re-enter your password" value={formData.confirmPassword} onChange={handleInputChange} className={`pl-10 ${fieldErrors.confirmPassword ? 'border-red-500 ring-red-200' : ''}`} disabled={isLoading}/>
                </div>
                {fieldErrors.confirmPassword && <p className="text-xs text-red-600 mt-1">{fieldErrors.confirmPassword}</p>}
              </div>
              <div className="space-y-2">
                <label_1.Label htmlFor="profileImage">Profile Image</label_1.Label>
                <input_1.Input id="profileImage" name="profileImage" type="file" accept="image/*" onChange={handleImageChange} disabled={isLoading || imageUploading}/>
                {imageUploading && <p className="text-xs text-blue-600">Uploading...</p>}
                {formData.profileImage && (<img src={formData.profileImage} alt="Profile Preview" className="h-16 w-16 rounded-full mt-2 object-cover border"/>)}
              </div>
              
              {error && (<alert_1.Alert variant="destructive" className="border-red-200 bg-red-50">
                  <alert_1.AlertDescription className="text-red-800">{error}</alert_1.AlertDescription>
                </alert_1.Alert>)}
              {success && (<alert_1.Alert variant="default" className="border-green-200 bg-green-50">
                  <alert_1.AlertDescription className="text-green-800">{success}</alert_1.AlertDescription>
                </alert_1.Alert>)}
              <button_1.Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium" disabled={isLoading}>
                {isLoading ? "Signing Up..." : "Sign Up"}
              </button_1.Button>
            </form>
          </card_1.CardContent>
        </card_1.Card>
      </div>
      </div>
    </AuthRedirect_1.AuthRedirect>);
}
