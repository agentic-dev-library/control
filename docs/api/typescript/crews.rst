Crews Module
=============

The crews module provides integration with Python CrewAI agents, allowing TypeScript code to invoke specialized autonomous agent crews as tools.

Overview
--------

The crews module enables:

- **Subprocess Execution**: Invoke Python crews via subprocess with clean separation
- **Type Safety**: Full TypeScript type definitions with runtime validation using Zod
- **Configuration**: Control crew availability and execution parameters
- **Error Handling**: Comprehensive error categorization and reporting across the language boundary

Core Concepts
-------------

**CrewTool**: Main class for invoking Python crews from TypeScript
**CrewToolConfig**: Configuration for crew execution (Python path, timeouts, environment)
**InvokeCrewOptions**: Parameters for invoking a specific crew
**CrewResult**: Structured result from crew execution
**CrewInfo**: Metadata about available crews

Types
-----

CrewToolConfig
~~~~~~~~~~~~~~

Configuration for crew tool execution.

.. code-block:: typescript

   interface CrewToolConfig {
     /** Path to Python executable (default: 'uv') */
     pythonExecutable?: string;
     /** Path to crew-agents package (default: auto-detect) */
     crewAgentsPath?: string;
     /** Default timeout in milliseconds (default: 300000 = 5 minutes) */
     defaultTimeout?: number;
     /** Environment variables to pass to crew execution */
     env?: Record<string, string>;
   }

InvokeCrewOptions
~~~~~~~~~~~~~~~~~

Options for invoking a crew.

.. code-block:: typescript

   interface InvokeCrewOptions {
     /** Package name (e.g., 'otterfall') */
     package: string;
     /** Crew name (e.g., 'game_builder') */
     crew: string;
     /** Input specification for the crew */
     input: string;
     /** Optional timeout override in milliseconds */
     timeout?: number;
     /** Optional additional environment variables */
     env?: Record<string, string>;
   }

CrewResult
~~~~~~~~~~

Result from crew execution.

.. code-block:: typescript

   interface CrewResult {
     /** Whether execution succeeded */
     success: boolean;
     /** Crew output (if successful) */
     output?: string;
     /** Error message (if failed) */
     error?: string;
     /** Exit code from subprocess */
     exitCode?: number;
     /** Execution time in milliseconds */
     duration: number;
   }

CrewInfo
~~~~~~~~

Information about an available crew.

.. code-block:: typescript

   interface CrewInfo {
     /** Package name */
     package: string;
     /** Crew name */
     name: string;
     /** Crew description */
     description: string;
   }

Validation
----------

The module uses Zod schemas for runtime validation:

CrewToolConfigSchema
~~~~~~~~~~~~~~~~~~~~

Validates crew tool configuration with defaults:

- ``pythonExecutable``: defaults to 'uv'
- ``defaultTimeout``: defaults to 300000ms (5 minutes), must be positive
- ``crewAgentsPath``: optional string
- ``env``: optional record of strings

InvokeCrewOptionsSchema
~~~~~~~~~~~~~~~~~~~~~~~

Validates crew invocation parameters:

- ``package``: required, alphanumeric with hyphens/underscores
- ``crew``: required, alphanumeric with hyphens/underscores
- ``input``: required string
- ``timeout``: optional positive number
- ``env``: optional record of strings

Validation Functions
~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   // Validate configuration
   function validateConfig(config: unknown): CrewToolConfig

   // Validate invocation options
   function validateInvokeOptions(options: unknown): InvokeCrewOptions

Configuration
-------------

Add crew configuration to ``agentic.config.json``:

.. code-block:: json

   {
     "crews": {
       "pythonExecutable": "uv",
       "crewAgentsPath": "./python",
       "defaultTimeout": 300000,
       "env": {
         "ANTHROPIC_API_KEY": "ANTHROPIC_API_KEY"
       }
     }
   }

Usage Examples
--------------

Basic Crew Invocation
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { CrewTool } from 'agentic-control';

   const crewTool = new CrewTool({
     pythonExecutable: 'uv',
     crewAgentsPath: './python',
   });

   const result = await crewTool.invokeCrew({
     package: 'otterfall',
     crew: 'game_builder',
     input: 'Create a QuestComponent with reward tracking',
   });

   if (result.success) {
     console.log('Crew output:', result.output);
   } else {
     console.error('Crew failed:', result.error);
   }

With Timeout Override
~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   const result = await crewTool.invokeCrew({
     package: 'otterfall',
     crew: 'game_builder',
     input: 'Complex task requiring more time',
     timeout: 600000, // 10 minutes
   });

With Environment Variables
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   const result = await crewTool.invokeCrew({
     package: 'otterfall',
     crew: 'asset_pipeline',
     input: 'Generate 3D model',
     env: {
       MESHY_API_KEY: process.env.MESHY_API_KEY,
     },
   });

List Available Crews
~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   const crews = await crewTool.listCrews();
   
   for (const crew of crews) {
     console.log(`${crew.package}/${crew.name}: ${crew.description}`);
   }

Get Crew Information
~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   const info = await crewTool.getCrewInfo('otterfall', 'game_builder');
   console.log(info.description);

Integration with Fleet
~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { Fleet, CrewTool } from 'agentic-control';

   const fleet = new Fleet();
   const crewTool = new CrewTool();

   // Generate spec using crew
   const spec = await crewTool.invokeCrew({
     package: 'otterfall',
     crew: 'game_builder',
     input: 'Create a QuestComponent',
   });

   if (spec.success) {
     // Spawn agent with crew-generated spec
     await fleet.spawn({
       repository: 'https://github.com/org/repo',
       task: spec.output,
     });
   }

Integration with Triage
~~~~~~~~~~~~~~~~~~~~~~~

.. code-block:: typescript

   import { AIAnalyzer, CrewTool } from 'agentic-control';

   const analyzer = new AIAnalyzer({ repo: 'org/repo' });
   const crewTool = new CrewTool();

   // Analyze with AI
   const analysis = await analyzer.quickTriage('Need new game feature');

   // Delegate to specialized crew
   const crewResult = await crewTool.invokeCrew({
     package: 'otterfall',
     crew: 'gameplay_design',
     input: analysis.summary,
   });

Error Handling
--------------

The module provides comprehensive error handling:

.. code-block:: typescript

   try {
     const result = await crewTool.invokeCrew({
       package: 'invalid-package',
       crew: 'nonexistent',
       input: 'test',
     });

     if (!result.success) {
       // Crew execution failed
       console.error('Crew error:', result.error);
       console.error('Exit code:', result.exitCode);
     }
   } catch (error) {
     // Configuration or validation error
     if (error instanceof ZodError) {
       console.error('Invalid parameters:', error.errors);
     } else {
       console.error('Unexpected error:', error);
     }
   }

Error Categories
~~~~~~~~~~~~~~~~

1. **Configuration Errors**: Invalid Python path, timeout values
2. **Validation Errors**: Invalid package/crew names, missing parameters
3. **Subprocess Errors**: Failed to spawn process, Python not found
4. **Crew Execution Errors**: Crew raised exception, invalid output
5. **Communication Errors**: Failed to parse output, incomplete data

Best Practices
--------------

1. **Configure Once**: Create a single CrewTool instance and reuse it
2. **Handle Timeouts**: Set appropriate timeouts for long-running crews
3. **Check Success**: Always check ``result.success`` before using output
4. **Environment Variables**: Pass sensitive keys via env, not in input
5. **Error Context**: Log ``result.error`` and ``result.exitCode`` for debugging

Standalone vs Integrated
-------------------------

The crews module is **optional**. The TypeScript system works independently:

**Without Crews** (Standalone):

.. code-block:: typescript

   import { Fleet, AIAnalyzer } from 'agentic-control';

   // Full fleet and triage functionality without Python
   const fleet = new Fleet();
   const analyzer = new AIAnalyzer({ repo: 'org/repo' });

**With Crews** (Integrated):

.. code-block:: typescript

   import { Fleet, AIAnalyzer, CrewTool } from 'agentic-control';

   // Enhanced with Python crew capabilities
   const fleet = new Fleet();
   const analyzer = new AIAnalyzer({ repo: 'org/repo' });
   const crewTool = new CrewTool();

See Also
--------

- :doc:`fleet` - Fleet management with crew integration
- :doc:`triage` - AI triage with crew delegation
- :doc:`../python/crews` - Python crew implementations
