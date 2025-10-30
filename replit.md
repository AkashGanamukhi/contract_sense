# Overview

This is a Smart Contract Manager application built as a legal-tech SaaS platform. The application allows users to upload PDF or DOCX contracts for AI-powered risk analysis using Google's Gemini API. The system extracts contract text, identifies risky clauses, provides risk scoring, and offers plain-language summaries with suggested improvements.

Key features include:
- Contract document upload and processing (PDF/DOCX)
- AI-powered risk analysis with clause-level highlighting
- Interactive dashboard with contract viewer and risk insights
- Color-coded risk levels (high/medium/low) with explanations
- Missing protection identification and recommendations
- Plain-language contract summaries

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript in a Vite-powered SPA
- **Styling**: Tailwind CSS with shadcn/ui component library using Radix UI primitives
- **State Management**: TanStack Query (React Query) for server state and caching
- **Routing**: Wouter for lightweight client-side routing
- **Theme System**: Custom theme provider with light/dark mode support

## Backend Architecture
- **Runtime**: Node.js with Express.js server
- **API Design**: RESTful structure with placeholder routes (currently frontend-only)
- **Development Setup**: Vite middleware integration for hot reloading
- **Build Process**: ESBuild for production bundling

## Data Storage Solutions
- **Database ORM**: Drizzle ORM configured for PostgreSQL with Neon Database
- **Schema Management**: Centralized schema definitions in TypeScript with Zod validation
- **Local Storage**: Browser localStorage for analysis persistence and user preferences
- **Migration System**: Drizzle-kit for database schema migrations

## AI Integration
- **AI Provider**: Google Gemini API for contract analysis
- **Analysis Pipeline**: 
  - Document text extraction from PDF/DOCX files
  - Structured prompt engineering for risk assessment
  - Response parsing into typed contract analysis objects
  - Risk categorization across multiple dimensions (payment, liability, termination, etc.)

## File Processing
- **PDF Processing**: PDF.js for client-side PDF text extraction
- **DOCX Processing**: Mammoth.js for Word document parsing
- **Validation**: File type and size validation before processing
- **Error Handling**: Comprehensive error handling for unsupported formats

## Component Design Patterns
- **Atomic Design**: Modular UI components with clear separation of concerns
- **Compound Components**: Complex components like ClauseExplorer and ContractViewer
- **Hook-based Logic**: Custom hooks for contract analysis, file upload, and data management
- **Responsive Design**: Mobile-first approach with adaptive layouts

## Risk Analysis Features
- **Clause Highlighting**: Interactive text highlighting with risk-level color coding
- **Risk Scoring**: Numerical risk assessment (0-100) for overall contracts and individual clauses
- **Missing Protections**: AI identification of standard legal protections absent from contracts
- **Alternative Suggestions**: AI-generated alternative clause recommendations
- **Plain Language Summaries**: Simplified explanations of complex legal language

# External Dependencies

## Core AI Service
- **Google Gemini API**: Primary AI service for contract analysis and risk assessment
- **API Key Management**: Environment variable configuration for secure API access

## Database Infrastructure
- **Neon Database**: Serverless PostgreSQL database for production deployment
- **Connection Pooling**: Built-in connection management through @neondatabase/serverless

## File Processing Libraries
- **PDF.js**: Client-side PDF parsing and text extraction
- **Mammoth.js**: Microsoft Word document processing
- **File Type Validation**: Built-in browser APIs for file handling

## UI Framework Dependencies
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **Tailwind CSS**: Utility-first CSS framework for rapid styling
- **Lucide React**: Modern icon library with consistent design language
- **Class Variance Authority**: Type-safe component variant management

## Development Tools
- **TypeScript**: Strong typing for enhanced developer experience
- **Vite**: Fast build tool and development server
- **ESBuild**: High-performance JavaScript bundler
- **PostCSS**: CSS processing with Tailwind integration

## Replit Integration
- **Replit Vite Plugins**: Development environment integration
- **Runtime Error Overlay**: Enhanced debugging capabilities
- **Cartographer**: Development-time code mapping and debugging