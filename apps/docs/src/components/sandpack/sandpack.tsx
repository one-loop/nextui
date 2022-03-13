import React, { useMemo } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackFiles,
  SandpackPredefinedTemplate,
  SandpackPreview
} from '@codesandbox/sandpack-react';
import { Grid } from '@nextui-org/react';
import withDefaults from '@utils/with-defaults';
import useLocalStorage from '@hooks/use-local-storage';
import { getHighlightedLines, getFileName } from './utils';
import CopyButton from './copy-button';
import { entry } from './entry';
import { nextuiTheme } from './themes';
import CodeSandboxButton from './codesanbox-button';
import BugReportButton from './bugreport-button';
import { StyledPlaygroundButtons } from './styles';
import LanguageSelector from './language-selector';
import { HighlightedLines } from './types';
import CodeViewer from './code-viewer';

interface Props {
  files?: SandpackFiles;
  showPreview?: boolean;
  showEditor?: boolean;
  showCopyCode?: boolean;
  showReportBug?: boolean;
  showOpenInCodeSandbox?: boolean;
  template?: SandpackPredefinedTemplate;
  highlightedLines?: HighlightedLines;
}

const defaultProps = {
  files: {},
  showPreview: true,
  showEditor: true,
  showOpenInCodeSandbox: true,
  showReportBug: true,
  showCopyCode: true,
  template: 'react'
};

export type SandpackProps = Props & typeof defaultProps;

const Sandpack: React.FC<React.PropsWithChildren<SandpackProps>> = ({
  files,
  children,
  highlightedLines,
  showPreview,
  showEditor,
  showReportBug,
  showOpenInCodeSandbox,
  showCopyCode,
  template
}) => {
  // once the user select a template we store it in local storage
  const [currentTemplate, setCurrentTemplate] =
    useLocalStorage<SandpackPredefinedTemplate>('currentTemplate', template);

  const hasTypescript = Object.keys(files).some(
    (file) => file.includes('.ts') || file.includes('.tsx')
  );

  const decorators = getHighlightedLines(highlightedLines, currentTemplate);

  const sandpackTemplate = useMemo(
    () =>
      currentTemplate === 'react-ts' && hasTypescript
        ? currentTemplate
        : 'react',
    [currentTemplate, hasTypescript]
  );

  // map current template to its mime type
  const mimeType = useMemo(
    () => (sandpackTemplate === 'react-ts' ? '.ts' : '.js'),
    [sandpackTemplate]
  );

  // get entry file by current template
  const entryFile = useMemo(
    () => (sandpackTemplate === 'react-ts' ? '/index.tsx' : '/index.js'),
    [sandpackTemplate]
  );

  // filter files by current template
  const filteredFiles = Object.keys(files).reduce((acc, key) => {
    if (key.includes(mimeType)) {
      // @ts-ignore
      acc[key] = files[key];
    }
    return acc;
  }, {});

  // sort files by dependency
  const sortedFiles = Object.keys(filteredFiles)
    .sort((a: string, b: string) => {
      const aFile = files[a] as string;
      const bFile = files[b] as string;
      const aName = getFileName(a);
      const bName = getFileName(b);
      if (aFile?.includes(bName)) {
        return -1;
      }
      if (bFile.includes(aName)) {
        return 1;
      }
      return 0;
    })
    .reduce((acc, key) => {
      return {
        ...acc,
        [key]: files[key]
      };
    }, {});

  // TODO: expand editor support
  return (
    <SandpackProvider
      skipEval
      template={sandpackTemplate}
      initMode="user-visible"
      initModeObserverOptions={{ rootMargin: '1400px 0px' }}
      customSetup={{
        files: {
          ...sortedFiles,
          [entryFile]: {
            code: entry,
            hidden: true
          }
        },
        entry: entryFile,
        dependencies: {
          '@nextui-org/react': 'debug'
        }
      }}
    >
      <SandpackLayout
        theme={nextuiTheme}
        style={{
          // @ts-ignore
          '--sp-border-radius': 'var(--nextui-radii-lg)',
          '--sp-colors-fg-inactive': 'transparent'
        }}
      >
        <Grid.Container css={{ maxWidth: '100%' }}>
          <Grid
            xs={12}
            css={{
              height: showPreview ? '350px' : 'auto'
            }}
          >
            {showPreview ? <SandpackPreview /> : children}
          </Grid>
          <Grid
            xs={12}
            css={{
              height: '350px',
              position: 'relative',
              '.sp-playground-buttons': {
                opacity: 0
              },
              '&:hover': {
                '.sp-playground-buttons': {
                  opacity: 1
                }
              },
              '.sp-stack': {
                background: 'var(--sp-colors-bg-default)',
                borderRadius: '$lg',
                overflowX: 'auto'
              }
            }}
          >
            {showEditor && (
              <CodeViewer showLineNumbers decorators={decorators} />
            )}
            <StyledPlaygroundButtons className="sp-playground-buttons">
              {showReportBug && <BugReportButton />}
              {showCopyCode && <CopyButton />}
              {!showPreview && showOpenInCodeSandbox && <CodeSandboxButton />}
            </StyledPlaygroundButtons>

            {hasTypescript && sandpackTemplate && (
              <LanguageSelector
                template={sandpackTemplate}
                onChange={setCurrentTemplate}
              />
            )}
          </Grid>
        </Grid.Container>
      </SandpackLayout>
    </SandpackProvider>
  );
};

export default withDefaults(Sandpack, defaultProps);