---
title: Plan Summary
sidebar_position: 0
---

# **EducationPub RBAC Implementation: Summary**

This document provides a high-level overview of the Role-Based Access Control (RBAC) implementation plan for the EducationPub MVP. The primary goal is to establish a robust authorization system using CASL.js, where permissions are defined in YAML files and loaded at application startup, serving as the single source of truth.

## **Key Features:**

* **YAML-driven Configuration:** All roles and their associated permissions are defined in config/roles.yaml. This file is loaded once at application startup, making the authorization rules immutable at runtime and version-controlled with the application codebase.  
* **CASL.js for Authorization:** Leverages the powerful CASL.js library for defining and checking fine-grained permissions, including CRUD operations, field-level access, and conditional (resource-scoped) rules.  
* **Multiple Roles per User:** Users can be assigned multiple roles, inheriting permissions from all assigned roles.  
* **Inclusive and Restrictive Permissions:** Supports both allow (inclusive) and deny (restrictive) permission types, enabling complex authorization policies where deny rules override allow rules.  
* **Resource-Scoped Authorization (IDOR Prevention):** Implements a robust mechanism using a custom @Resource() decorator and an enhanced AbilitiesGuard to ensure permissions are checked against specific resource instances (e.g., a user can only update their *own* flashcards). This is crucial for preventing Insecure Direct Object References (IDOR).  
* **Performance with Redis Caching:** AppAbility instances for users are cached in Redis to optimize performance by avoiding repeated re-computation of abilities on every request.  
* **Operational Tooling (Future CLI):** The plan outlines the need for a separate CLI tool to manage operational tasks like initial admin creation and cleaning up stale user roles, ensuring secure administration.

## **Phased Implementation Overview:**

The implementation is broken down into four sequential phases:

* **Phase 1: Core Data Model & YAML Loading Setup:** Focuses on updating the UserEntity to store roles as a JSONB array, removing obsolete database entities for roles/permissions, defining the UserRole enum, creating the roles.yaml configuration, and implementing the PermissionConfigService to load these rules into memory.  
* **Phase 2: Core Authentication & Authorization Pipeline:** Integrates roles into the AuthService and JwtStrategy for user assignment and JWT payload inclusion. It also establishes the core AbilitiesGuard and @CheckAbilities() decorator for declarative authorization.  
* **Phase 3: Resource-Scoped Authorization & Controller Integration:** Implements the @Resource() parameter decorator to fetch resource instances for authorization checks and applies the new RBAC guards and decorators to relevant controllers (e.g., Robots, Flashcards, Flashcard Models).  
* **Phase 4: Operational Security & CLI Tooling Integration:** Addresses critical security configurations, including sensitive data logging, YAML file system permissions, and outlines the design for a future CLI tool to handle administrative tasks like initial admin creation and stale role cleanup.

This structured approach ensures a systematic and secure implementation of the RBAC system, aligning with the project's MVP goals.