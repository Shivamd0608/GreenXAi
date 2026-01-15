"use client";
import { useState } from "react";
import { ethers } from "ethers"; // 🆕 Added for hash generation

export default function ProjectApplicationForm({ onNext }) {
  const [formData, setFormData] = useState({
    projectName: "",
    tokenId: "",
    location: "",
    creditType: "",
    certificateHash: "",
  });

  // Enum mapping 🆕
  const creditEnumMap = {
    Green: 0,
    Carbon: 1,
    Water: 2,
    Renewable: 3,
  };

  const creditTypes = ["Green", "Carbon", "Water", "Renewable"];

  // Validation constants (must match smart contract)
  const MAX_TITLE_LENGTH = 30;
  const MIN_HASH_LENGTH = 46;
  const MAX_HASH_LENGTH = 128;

  // 🆕 Function to generate hash (50–70 bytes)
  const generateCertificateHash = (description) => {
    const hash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(description));
    return hash.slice(0, 70);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate project name length (must match contract)
    if (formData.projectName.length > MAX_TITLE_LENGTH) {
      alert(`Project name must be ${MAX_TITLE_LENGTH} characters or less`);
      return;
    }

    // 🆕 Convert creditType to enum and generate hash
    const creditEnum = creditEnumMap[formData.creditType];
    const hash = generateCertificateHash(formData.description);

    // Validate hash length
    if (hash.length < MIN_HASH_LENGTH || hash.length > MAX_HASH_LENGTH) {
      alert(
        `Certificate hash must be between ${MIN_HASH_LENGTH} and ${MAX_HASH_LENGTH} characters`
      );
      return;
    }

    const finalData = {
      ...formData,
      creditType: creditEnum,
      certificateHash: hash,
    };

    console.log("Project Application Submitted:", finalData);
    localStorage.setItem("onboardingProject", JSON.stringify(finalData));
    if (onNext) onNext();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Project Name *{" "}
          <span
            className={`text-xs ${
              formData.projectName.length > MAX_TITLE_LENGTH
                ? "text-red-400"
                : "text-gray-500"
            }`}
          >
            ({formData.projectName.length}/{MAX_TITLE_LENGTH})
          </span>
        </label>
        <input
          type="text"
          name="projectName"
          required
          maxLength={MAX_TITLE_LENGTH}
          className={`w-full bg-gray-800 border rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all ${
            formData.projectName.length > MAX_TITLE_LENGTH
              ? "border-red-500"
              : "border-gray-600"
          }`}
          value={formData.projectName}
          onChange={handleChange}
          placeholder="Enter project name (max 30 chars)"
        />
        {formData.projectName.length > MAX_TITLE_LENGTH && (
          <p className="text-red-400 text-xs">
            Project name must be 30 characters or less
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Token ID *
        </label>
        <input
          type="number"
          name="tokenId"
          required
          min="0"
          step="1"
          inputMode="numeric"
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          value={formData.tokenId}
          onChange={handleChange}
          placeholder="Enter numeric token ID"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Green Credit Type *
        </label>
        <select
          name="creditType"
          required
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
          value={formData.creditType}
          onChange={handleChange}
        >
          <option value="" className="bg-gray-800">
            Select Credit Type
          </option>
          {creditTypes.map((type) => (
            <option key={type} value={type} className="bg-gray-800">
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-300">
            Location *
          </label>
          <input
            type="text"
            name="location"
            required
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
            value={formData.location}
            onChange={handleChange}
            placeholder="City, Country"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Project Description *
        </label>
        <textarea
          name="description"
          rows={2}
          required
          className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
          value={formData.description}
          onChange={handleChange}
          placeholder="Describe your project..."
        />
      </div>

      <div className="pt-4">
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white py-3 px-6 rounded-lg hover:from-emerald-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 font-semibold shadow-lg"
        >
          Save & Continue
        </button>
      </div>
    </form>
  );
}
