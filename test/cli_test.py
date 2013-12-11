from collections import defaultdict
from itertools import chain, repeat

from mock import call, patch, MagicMock as Mock
from nose.tools import raises

import spreads
import spreads.cli as cli
import spreads.confit as confit
from spreads.util import DeviceException

spreads.util.find_in_path = Mock(return_value=True)


class TestCLI(object):
    def setUp(self):
        self.workflow = Mock()
        self.workflow.devices = [Mock(), Mock()]
        self.workflow.devices[0].orientation = 'right'
        self.workflow.devices[1].orientation = 'left'
        self.workflow.config = confit.Configuration('test_cli')

    def test_capture(self):
        self.workflow.config['capture']['capture_keys'] = ["b", " "]
        cli.getch = Mock(side_effect=chain(repeat('b', 3), 'c'))
        cli.capture(self.workflow)
        assert cli.getch.call_count == 4
        assert self.workflow.prepare_capture.call_count == 1
        assert self.workflow.capture.call_count == 3
        assert self.workflow.finish_capture.call_count == 1
        #TODO: stats correct?

    @raises(DeviceException)
    def test_capture_nodevices(self):
        cli.getch = Mock(return_value=' ')
        self.workflow.devices = []
        cli.capture(self.workflow)

    @raises(DeviceException)
    def test_capture_noorientation(self):
        self.workflow.devices[0].orientation = None
        cli.getch = Mock(return_value='c')
        cli.capture(self.workflow)

    def test_postprocess(self):
        self.workflow.path = '/tmp/foo'
        cli.postprocess(self.workflow)
        assert self.workflow.process.call_count == 1

    def test_wizard(self):
        self.workflow.path = '/tmp/foo'
        self.workflow.config['capture']['capture_keys'] = ["b", " "]
        cli.getch = Mock(side_effect=chain(repeat('b', 10), 'c',
                                           repeat('b', 10)))
        cli.wizard(self.workflow)

    def test_parser(self):
        cli.get_pluginmanager = Mock()
        # TODO: Test if plugin arguments are added
        parser = cli.setup_parser()

    @patch('os.path.exists')
    def test_main(self, exists):
        # TODO: Config dumped?
        # TODO: Config from args?
        # TODO: Loglevel set correctly?
        # TODO: Correct function executed?
        cli.confit = Mock()
        cli.Workflow = Mock(return_value=self.workflow)
        self.workflow.config["subcommand"] = "test_cmd"
        self.workflow.config["loglevel"] = "info"
        self.workflow.config.dump = Mock()
        cli.confit.LazyConfig = Mock(return_value=self.workflow.config)
        cli.test_cmd = Mock()
        cli.setup_plugin_config = Mock()
        cli.setup_parser = Mock()
        exists.return_value = False
        cli.os.path.exists = exists
        cli.main()
