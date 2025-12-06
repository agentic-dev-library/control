TypeScript API Reference
========================

The TypeScript core provides fleet management, triage, and orchestration capabilities.

Overview
--------

The agentic-control TypeScript package is organized into several modules:

- **Fleet** - Agent fleet management and orchestration
- **Triage** - Issue analysis and routing
- **Crews** - Python CrewAI integration (optional)
- **GitHub** - GitHub API integration
- **Handoff** - Agent handoff management
- **Core** - Shared utilities and configuration

.. toctree::
   :maxdepth: 2

   fleet
   triage
   crews
   github
   handoff
   core

Module Summary
--------------

Fleet Module
~~~~~~~~~~~~

The fleet module provides capabilities for managing and orchestrating AI agents.
See :doc:`fleet` for detailed API documentation.

Triage Module
~~~~~~~~~~~~~

The triage module provides issue analysis and routing capabilities.
See :doc:`triage` for detailed API documentation.

Crews Module
~~~~~~~~~~~~

The crews module provides optional integration with Python CrewAI agents.
Enables TypeScript code to invoke specialized autonomous agent crews as tools.
See :doc:`crews` for detailed API documentation.

GitHub Module
~~~~~~~~~~~~~

The GitHub module provides integration with the GitHub API.
See :doc:`github` for detailed API documentation.

Handoff Module
~~~~~~~~~~~~~~

The handoff module provides agent handoff management capabilities.
See :doc:`handoff` for detailed API documentation.

Core Module
~~~~~~~~~~~

The core module provides shared utilities and configuration.
See :doc:`core` for detailed API documentation.
