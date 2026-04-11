variable "github_repo" {
  description = "GitHub repo in format username/repo"
  type        = string
}

variable "github_branch" {
  description = "Branch allowed to assume role"
  type        = string
  default     = "main"
}